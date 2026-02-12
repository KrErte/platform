package eu.buildquote.service;

import eu.buildquote.dto.boq.*;
import eu.buildquote.entity.BillOfQuantities;
import eu.buildquote.entity.BoqItem;
import eu.buildquote.entity.Project;
import eu.buildquote.exception.BadRequestException;
import eu.buildquote.repository.BillOfQuantitiesRepository;
import eu.buildquote.repository.BoqItemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.apache.commons.text.similarity.LevenshteinDistance;
import org.apache.poi.hssf.usermodel.HSSFWorkbook;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class BoqParserService {

    private final BillOfQuantitiesRepository boqRepository;
    private final BoqItemRepository boqItemRepository;
    private final ProjectService projectService;

    private static final double CONFIDENCE_THRESHOLD = 0.7;
    private static final int PREVIEW_ROWS = 10;

    private static final Map<String, List<String>> COLUMN_ALIASES = Map.of(
            "item_number", List.of("nr", "jrk", "item", "#", "number", "no", "item no", "item number", "jrk nr"),
            "description", List.of("kirjeldus", "description", "nimetus", "töö kirjeldus", "desc", "work description", "item description"),
            "quantity", List.of("kogus", "quantity", "maht", "amount", "qty", "hulk", "kogused"),
            "unit", List.of("ühik", "unit", "mõõtühik", "uom", "unit of measure"),
            "material_type", List.of("materjal", "material", "tüüp", "type", "material type", "materjali tüüp"),
            "specification", List.of("spetsifikatsioon", "spec", "märkused", "notes", "specification", "specs", "lisainfo")
    );

    @Transactional
    public BoqUploadResponseDto parseAndUpload(Long projectId, MultipartFile file) {
        Project project = projectService.findProjectById(projectId);
        String filename = file.getOriginalFilename();

        if (filename == null || filename.isBlank()) {
            throw new BadRequestException("Filename is required");
        }

        String extension = getFileExtension(filename).toLowerCase();
        if (!List.of("xlsx", "xls", "csv").contains(extension)) {
            throw new BadRequestException("Unsupported file format. Please upload .xlsx, .xls, or .csv files");
        }

        try {
            ParseResult parseResult;
            if ("csv".equals(extension)) {
                parseResult = parseCsv(file.getInputStream());
            } else {
                parseResult = parseExcel(file.getInputStream(), extension);
            }

            BillOfQuantities boq = BillOfQuantities.builder()
                    .project(project)
                    .originalFilename(filename)
                    .build();
            boq = boqRepository.save(boq);

            double overallConfidence = calculateOverallConfidence(parseResult.columnMappings());
            boolean requiresConfirmation = overallConfidence < CONFIDENCE_THRESHOLD;

            if (!requiresConfirmation) {
                saveItems(boq, parseResult.items());
            }

            return BoqUploadResponseDto.builder()
                    .boqId(boq.getId())
                    .filename(filename)
                    .totalRowsParsed(parseResult.items().size())
                    .requiresConfirmation(requiresConfirmation)
                    .overallConfidence(overallConfidence)
                    .columnMappings(parseResult.columnMappings())
                    .previewItems(parseResult.items().stream().limit(PREVIEW_ROWS).toList())
                    .warnings(parseResult.warnings())
                    .build();

        } catch (IOException e) {
            log.error("Error parsing file: {}", filename, e);
            throw new BadRequestException("Failed to parse file: " + e.getMessage());
        }
    }

    @Transactional
    public BoqUploadResponseDto confirmMapping(Long projectId, ConfirmMappingRequestDto request, MultipartFile file) {
        projectService.findProjectById(projectId);

        BillOfQuantities boq = boqRepository.findById(request.getBoqId())
                .orElseThrow(() -> new BadRequestException("BOQ not found"));

        if (file == null || file.isEmpty()) {
            throw new BadRequestException("File is required for re-parsing with confirmed mappings");
        }

        String filename = file.getOriginalFilename();
        String extension = getFileExtension(filename != null ? filename : "").toLowerCase();

        try {
            List<List<String>> rawData;
            List<String> headers;

            if ("csv".equals(extension)) {
                RawParseResult rawResult = parseCsvRaw(file.getInputStream());
                rawData = rawResult.data();
                headers = rawResult.headers();
            } else {
                RawParseResult rawResult = parseExcelRaw(file.getInputStream(), extension);
                rawData = rawResult.data();
                headers = rawResult.headers();
            }

            List<ColumnMappingDto> confirmedMappings = new ArrayList<>();
            for (Map.Entry<String, Integer> entry : request.getColumnMappings().entrySet()) {
                if (entry.getValue() >= 0 && entry.getValue() < headers.size()) {
                    confirmedMappings.add(ColumnMappingDto.builder()
                            .targetField(entry.getKey())
                            .columnIndex(entry.getValue())
                            .detectedHeader(headers.get(entry.getValue()))
                            .confidence(1.0)
                            .alternativeHeaders(List.of())
                            .build());
                }
            }

            List<ParsedBoqItemDto> items = new ArrayList<>();
            List<String> warnings = new ArrayList<>();
            int rowNum = 2;

            for (List<String> row : rawData) {
                try {
                    ParsedBoqItemDto item = parseRowWithMappings(row, rowNum, confirmedMappings);
                    items.add(item);
                } catch (Exception e) {
                    warnings.add("Row " + rowNum + ": " + e.getMessage());
                }
                rowNum++;
            }

            saveItems(boq, items);

            return BoqUploadResponseDto.builder()
                    .boqId(boq.getId())
                    .filename(boq.getOriginalFilename())
                    .totalRowsParsed(items.size())
                    .requiresConfirmation(false)
                    .overallConfidence(1.0)
                    .columnMappings(confirmedMappings)
                    .previewItems(items.stream().limit(PREVIEW_ROWS).toList())
                    .warnings(warnings)
                    .build();

        } catch (IOException e) {
            log.error("Error re-parsing file with confirmed mappings", e);
            throw new BadRequestException("Failed to re-parse file: " + e.getMessage());
        }
    }

    private ParseResult parseExcel(InputStream inputStream, String extension) throws IOException {
        Workbook workbook = "xlsx".equals(extension)
                ? new XSSFWorkbook(inputStream)
                : new HSSFWorkbook(inputStream);

        Sheet sheet = workbook.getSheetAt(0);
        List<String> headers = extractHeaders(sheet);
        List<ColumnMappingDto> columnMappings = detectColumnMappings(headers);

        List<ParsedBoqItemDto> items = new ArrayList<>();
        List<String> warnings = new ArrayList<>();

        for (int i = 1; i <= sheet.getLastRowNum(); i++) {
            Row row = sheet.getRow(i);
            if (row == null || isRowEmpty(row)) continue;

            try {
                ParsedBoqItemDto item = parseExcelRow(row, i + 1, columnMappings);
                items.add(item);
            } catch (Exception e) {
                warnings.add("Row " + (i + 1) + ": " + e.getMessage());
            }
        }

        workbook.close();
        return new ParseResult(columnMappings, items, warnings);
    }

    private RawParseResult parseExcelRaw(InputStream inputStream, String extension) throws IOException {
        Workbook workbook = "xlsx".equals(extension)
                ? new XSSFWorkbook(inputStream)
                : new HSSFWorkbook(inputStream);

        Sheet sheet = workbook.getSheetAt(0);
        List<String> headers = extractHeaders(sheet);
        List<List<String>> data = new ArrayList<>();

        for (int i = 1; i <= sheet.getLastRowNum(); i++) {
            Row row = sheet.getRow(i);
            if (row == null || isRowEmpty(row)) continue;

            List<String> rowData = new ArrayList<>();
            for (int j = 0; j < row.getLastCellNum(); j++) {
                Cell cell = row.getCell(j);
                rowData.add(getCellValueAsString(cell));
            }
            data.add(rowData);
        }

        workbook.close();
        return new RawParseResult(headers, data);
    }

    private ParseResult parseCsv(InputStream inputStream) throws IOException {
        CSVParser parser = CSVParser.parse(
                new InputStreamReader(inputStream, StandardCharsets.UTF_8),
                CSVFormat.DEFAULT.builder()
                        .setHeader()
                        .setSkipHeaderRecord(true)
                        .setTrim(true)
                        .build()
        );

        List<String> headers = parser.getHeaderNames();
        List<ColumnMappingDto> columnMappings = detectColumnMappings(headers);

        List<ParsedBoqItemDto> items = new ArrayList<>();
        List<String> warnings = new ArrayList<>();

        int rowNum = 2;
        for (CSVRecord record : parser) {
            try {
                ParsedBoqItemDto item = parseCsvRecord(record, rowNum, columnMappings);
                items.add(item);
            } catch (Exception e) {
                warnings.add("Row " + rowNum + ": " + e.getMessage());
            }
            rowNum++;
        }

        return new ParseResult(columnMappings, items, warnings);
    }

    private RawParseResult parseCsvRaw(InputStream inputStream) throws IOException {
        CSVParser parser = CSVParser.parse(
                new InputStreamReader(inputStream, StandardCharsets.UTF_8),
                CSVFormat.DEFAULT.builder()
                        .setHeader()
                        .setSkipHeaderRecord(true)
                        .setTrim(true)
                        .build()
        );

        List<String> headers = parser.getHeaderNames();
        List<List<String>> data = new ArrayList<>();

        for (CSVRecord record : parser) {
            List<String> rowData = new ArrayList<>();
            for (int i = 0; i < record.size(); i++) {
                rowData.add(record.get(i));
            }
            data.add(rowData);
        }

        return new RawParseResult(headers, data);
    }

    private List<String> extractHeaders(Sheet sheet) {
        Row headerRow = sheet.getRow(0);
        List<String> headers = new ArrayList<>();

        if (headerRow != null) {
            for (int i = 0; i < headerRow.getLastCellNum(); i++) {
                Cell cell = headerRow.getCell(i);
                headers.add(getCellValueAsString(cell));
            }
        }

        return headers;
    }

    private List<ColumnMappingDto> detectColumnMappings(List<String> headers) {
        List<ColumnMappingDto> mappings = new ArrayList<>();
        LevenshteinDistance levenshtein = new LevenshteinDistance();
        Set<Integer> usedColumns = new HashSet<>();

        for (String targetField : COLUMN_ALIASES.keySet()) {
            List<String> aliases = COLUMN_ALIASES.get(targetField);

            int bestColumnIndex = -1;
            double bestConfidence = 0.0;
            String bestHeader = null;
            List<String> alternatives = new ArrayList<>();

            for (int i = 0; i < headers.size(); i++) {
                if (usedColumns.contains(i)) continue;

                String header = headers.get(i).toLowerCase().trim();

                for (String alias : aliases) {
                    double confidence = calculateMatchConfidence(header, alias.toLowerCase(), levenshtein);

                    if (confidence > bestConfidence) {
                        if (bestHeader != null && bestConfidence > 0.5) {
                            alternatives.add(bestHeader);
                        }
                        bestConfidence = confidence;
                        bestColumnIndex = i;
                        bestHeader = headers.get(i);
                    } else if (confidence > 0.5 && !headers.get(i).equals(bestHeader)) {
                        alternatives.add(headers.get(i));
                    }
                }
            }

            if (bestColumnIndex >= 0 && bestConfidence > 0.3) {
                usedColumns.add(bestColumnIndex);
                mappings.add(ColumnMappingDto.builder()
                        .targetField(targetField)
                        .detectedHeader(bestHeader)
                        .columnIndex(bestColumnIndex)
                        .confidence(bestConfidence)
                        .alternativeHeaders(alternatives.stream().distinct().limit(3).toList())
                        .build());
            }
        }

        return mappings;
    }

    private double calculateMatchConfidence(String header, String alias, LevenshteinDistance levenshtein) {
        if (header.equals(alias)) {
            return 1.0;
        }

        if (header.contains(alias) || alias.contains(header)) {
            return 0.9;
        }

        int maxLen = Math.max(header.length(), alias.length());
        if (maxLen == 0) return 0.0;

        int distance = levenshtein.apply(header, alias);
        return 1.0 - ((double) distance / maxLen);
    }

    private double calculateOverallConfidence(List<ColumnMappingDto> mappings) {
        if (mappings.isEmpty()) return 0.0;

        Set<String> requiredFields = Set.of("description", "quantity", "unit");

        double totalConfidence = 0.0;
        int requiredFound = 0;

        for (ColumnMappingDto mapping : mappings) {
            totalConfidence += mapping.getConfidence();
            if (requiredFields.contains(mapping.getTargetField()) && mapping.getConfidence() > 0.5) {
                requiredFound++;
            }
        }

        if (requiredFound < requiredFields.size()) {
            return Math.min(totalConfidence / mappings.size() * 0.5, 0.5);
        }

        return totalConfidence / mappings.size();
    }

    private ParsedBoqItemDto parseExcelRow(Row row, int rowNum, List<ColumnMappingDto> mappings) {
        Map<String, String> values = new HashMap<>();

        for (ColumnMappingDto mapping : mappings) {
            Cell cell = row.getCell(mapping.getColumnIndex());
            values.put(mapping.getTargetField(), getCellValueAsString(cell));
        }

        return createParsedItem(rowNum, values);
    }

    private ParsedBoqItemDto parseCsvRecord(CSVRecord record, int rowNum, List<ColumnMappingDto> mappings) {
        Map<String, String> values = new HashMap<>();

        for (ColumnMappingDto mapping : mappings) {
            if (mapping.getColumnIndex() < record.size()) {
                values.put(mapping.getTargetField(), record.get(mapping.getColumnIndex()));
            }
        }

        return createParsedItem(rowNum, values);
    }

    private ParsedBoqItemDto parseRowWithMappings(List<String> row, int rowNum, List<ColumnMappingDto> mappings) {
        Map<String, String> values = new HashMap<>();

        for (ColumnMappingDto mapping : mappings) {
            if (mapping.getColumnIndex() < row.size()) {
                values.put(mapping.getTargetField(), row.get(mapping.getColumnIndex()));
            }
        }

        return createParsedItem(rowNum, values);
    }

    private ParsedBoqItemDto createParsedItem(int rowNum, Map<String, String> values) {
        String quantityStr = values.getOrDefault("quantity", "0");
        BigDecimal quantity;
        boolean hasError = false;
        String errorMsg = null;

        try {
            String cleanedQty = quantityStr.replace(",", ".").replaceAll("[^\\d.\\-]", "").trim();
            if (cleanedQty.isEmpty()) {
                cleanedQty = "0";
            }
            quantity = new BigDecimal(cleanedQty);
        } catch (NumberFormatException e) {
            quantity = BigDecimal.ZERO;
            hasError = true;
            errorMsg = "Invalid quantity: " + quantityStr;
        }

        String description = values.getOrDefault("description", "");
        if (description.isBlank() && !hasError) {
            hasError = true;
            errorMsg = "Missing description";
        }

        return ParsedBoqItemDto.builder()
                .rowNumber(rowNum)
                .itemNumber(values.get("item_number"))
                .description(description)
                .quantity(quantity)
                .unit(values.getOrDefault("unit", ""))
                .materialType(values.get("material_type"))
                .specification(values.get("specification"))
                .hasParsingErrors(hasError)
                .errorMessage(errorMsg)
                .build();
    }

    private void saveItems(BillOfQuantities boq, List<ParsedBoqItemDto> parsedItems) {
        List<BoqItem> items = parsedItems.stream()
                .filter(item -> !item.isHasParsingErrors())
                .filter(item -> item.getDescription() != null && !item.getDescription().isBlank())
                .map(parsed -> BoqItem.builder()
                        .billOfQuantities(boq)
                        .itemNumber(parsed.getItemNumber())
                        .description(parsed.getDescription())
                        .quantity(parsed.getQuantity())
                        .unit(parsed.getUnit())
                        .materialType(parsed.getMaterialType())
                        .specification(parsed.getSpecification())
                        .build())
                .toList();

        boqItemRepository.saveAll(items);
    }

    private String getCellValueAsString(Cell cell) {
        if (cell == null) return "";

        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue();
            case NUMERIC -> {
                if (DateUtil.isCellDateFormatted(cell)) {
                    yield cell.getLocalDateTimeCellValue().toString();
                }
                double numValue = cell.getNumericCellValue();
                if (numValue == Math.floor(numValue)) {
                    yield String.valueOf((long) numValue);
                }
                yield String.valueOf(numValue);
            }
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            case FORMULA -> {
                try {
                    yield String.valueOf(cell.getNumericCellValue());
                } catch (Exception e) {
                    yield cell.getStringCellValue();
                }
            }
            default -> "";
        };
    }

    private boolean isRowEmpty(Row row) {
        for (int i = 0; i < row.getLastCellNum(); i++) {
            Cell cell = row.getCell(i);
            if (cell != null && !getCellValueAsString(cell).isBlank()) {
                return false;
            }
        }
        return true;
    }

    private String getFileExtension(String filename) {
        int lastDot = filename.lastIndexOf('.');
        return lastDot > 0 ? filename.substring(lastDot + 1) : "";
    }

    private record ParseResult(
            List<ColumnMappingDto> columnMappings,
            List<ParsedBoqItemDto> items,
            List<String> warnings
    ) {}

    private record RawParseResult(
            List<String> headers,
            List<List<String>> data
    ) {}
}
