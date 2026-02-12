package eu.buildquote.service;

import eu.buildquote.entity.*;
import eu.buildquote.enums.ProjectStatus;
import eu.buildquote.enums.RfqStatus;
import eu.buildquote.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DemoDataService {

    private final UserRepository userRepository;
    private final SupplierRepository supplierRepository;
    private final ProjectRepository projectRepository;
    private final BillOfQuantitiesRepository boqRepository;
    private final BoqItemRepository boqItemRepository;
    private final RfqRequestRepository rfqRequestRepository;

    @Transactional
    public void loadDemoData(User currentUser) {
        // Check if demo data already exists
        if (supplierRepository.countByUser(currentUser) > 0) {
            return; // Demo data already loaded
        }

        // Create suppliers
        Supplier betoonimeister = createSupplier(currentUser, "Betoonimeister OÜ", "Andres Kivi",
                "betoon@betoonimeister.ee", "+372 5123 4567",
                Arrays.asList("betoon", "vundament"), "Spetsialiseerunud betoonitöödele üle 15 aasta");

        Supplier terasmarket = createSupplier(currentUser, "Terasmarket AS", "Meelis Raud",
                "info@terasmarket.ee", "+372 5234 5678",
                Arrays.asList("teras", "armatuur"), "Suurim terasetarnija Baltikumis");

        Supplier aknaexpert = createSupplier(currentUser, "Akna Expert OÜ", "Liis Klaas",
                "tellimus@aknaexpert.ee", "+372 5345 6789",
                Arrays.asList("aknad", "uksed"), "Kvaliteetsed PVC ja puitaknad");

        Supplier puitjapalk = createSupplier(currentUser, "Puit ja Palk OÜ", "Toomas Tamm",
                "info@puitjapalk.ee", "+372 5456 7890",
                Arrays.asList("puit", "saematerjal"), "Sertifitseeritud puitmaterjal");

        Supplier soojustuspro = createSupplier(currentUser, "Soojustus Pro OÜ", "Kati Soe",
                "info@soojustuspro.ee", "+372 5567 8901",
                Arrays.asList("soojustus", "isolatsioon"), "Energiatõhususe eksperdid");

        Supplier katusgrupp = createSupplier(currentUser, "Katus Grupp AS", "Jaan Katus",
                "info@katusgrupp.ee", "+372 5678 9012",
                Arrays.asList("katusematerjalid"), "Katuselahendused A-st Z-ni");

        Supplier elektripartner = createSupplier(currentUser, "Elektri Partner OÜ", "Mart Volt",
                "info@elektripartner.ee", "+372 5789 0123",
                Arrays.asList("elektrimaterjalid"), "Professionaalsed elektritarbed");

        Supplier sanitaarplus = createSupplier(currentUser, "Sanitaar Plus OÜ", "Anna Vesi",
                "info@sanitaarplus.ee", "+372 5890 1234",
                Arrays.asList("sanitaartehnika", "torud"), "Kõik sanitaartehnika vajadused");

        // Create Project 1: Tartu mnt büroohoone
        Project project1 = Project.builder()
                .user(currentUser)
                .name("Tartu mnt 50 büroohoone rekonstrueerimine")
                .description("Tartu maanteel asuva 5-korruselise büroohoone täielik rekonstrueerimine, " +
                        "sh fassaadi uuendamine, küttesüsteemi vahetus ja siseruumide renoveerimine. " +
                        "Ehituspind kokku 3200 m².")
                .status(ProjectStatus.ACTIVE)
                .build();
        projectRepository.save(project1);

        // Create BOQ for Project 1
        BillOfQuantities boq1 = BillOfQuantities.builder()
                .project(project1)
                .originalFilename("tartu_mnt_50_boq.xlsx")
                .build();
        boqRepository.save(boq1);

        // Add BOQ items for Project 1
        createBoqItem(boq1, "1.1", "Betoon C30/37", "betoon", new BigDecimal("45"), "m³", "Vundamendi ja vahelagede betoneerimine");
        createBoqItem(boq1, "1.2", "Armatuur B500B ø12-25", "teras", new BigDecimal("3200"), "kg", "Armatuuri paigaldus vundamendi ja vahelagede");
        createBoqItem(boq1, "2.1", "Soojustusisolatsioon EPS 150mm", "soojustus", new BigDecimal("320"), "m²", "Fassaadi soojustamine");
        createBoqItem(boq1, "2.2", "Soojustusisolatsioon XPS 100mm", "soojustus", new BigDecimal("180"), "m²", "Sokli soojustamine");
        createBoqItem(boq1, "3.1", "Aknad 3-kordne klaaspakett", "aknad", new BigDecimal("24"), "tk", "PVC aknad U=0.9, valge");
        createBoqItem(boq1, "3.2", "Välisuksed alumiinium", "uksed", new BigDecimal("4"), "tk", "Alumiiniumprofiil, automaatne avamine");
        createBoqItem(boq1, "4.1", "Teraskonstruktsioonid IPE 300", "teras", new BigDecimal("1800"), "kg", "Kandekonstruktsioonid");
        createBoqItem(boq1, "4.2", "Teraskonstruktsioonid HEA 200", "teras", new BigDecimal("950"), "kg", "Tugipostid");
        createBoqItem(boq1, "5.1", "Kipsplaat 12.5mm", "ehitus", new BigDecimal("450"), "m²", "Siseseinte viimistlus");
        createBoqItem(boq1, "5.2", "Kipsplaat niiskuskindel 12.5mm", "ehitus", new BigDecimal("120"), "m²", "Märgade ruumide seinad");
        createBoqItem(boq1, "6.1", "Põrandaküte torud PE-Xa 16mm", "sanitaar", new BigDecimal("680"), "m", "Põrandaküttesüsteem");
        createBoqItem(boq1, "6.2", "Elektrikaabel NYM 3x2.5mm²", "elekter", new BigDecimal("1200"), "m", "Põhikaabeldus");
        createBoqItem(boq1, "6.3", "Elektrikaabel NYM 5x4mm²", "elekter", new BigDecimal("340"), "m", "Jõukaabeldus");
        createBoqItem(boq1, "7.1", "Sanitaartorud PPR 25mm", "sanitaar", new BigDecimal("340"), "m", "Veevarustus");
        createBoqItem(boq1, "7.2", "Kanalisatsioonitorud PVC 110mm", "sanitaar", new BigDecimal("180"), "m", "Kanalisatsioon");
        createBoqItem(boq1, "8.1", "Katusekate PVC membraan 1.5mm", "katus", new BigDecimal("280"), "m²", "Lamekatus");
        createBoqItem(boq1, "8.2", "Katuse soojustus PIR 200mm", "katus", new BigDecimal("280"), "m²", "Katuse soojustamine");
        createBoqItem(boq1, "9.1", "Siseuksed tamm 900x2100", "uksed", new BigDecimal("18"), "tk", "Täispuituksed");
        createBoqItem(boq1, "10.1", "Plaatimistöö (seinad)", "viimistlus", new BigDecimal("120"), "m²", "Portselanplaadid 60x60");
        createBoqItem(boq1, "10.2", "Fassaadiviimistlus krohv", "fassaad", new BigDecimal("410"), "m²", "Silikoonkrohv");
        createBoqItem(boq1, "11.1", "Põrandabetoon C25/30 sile", "betoon", new BigDecimal("380"), "m²", "Tasanduskiht");
        createBoqItem(boq1, "12.1", "Tuletõkkeuksed EI30", "uksed", new BigDecimal("6"), "tk", "Metallist tuletõkkeuksed");

        // Create Project 2: Pärnu mnt korterelamu
        Project project2 = Project.builder()
                .user(currentUser)
                .name("Pärnu mnt 15 korterelamu")
                .description("Uue 4-korruselise korterelamu ehitamine. " +
                        "24 korterit, maa-alune parkla. Ehituspind 2800 m².")
                .status(ProjectStatus.DRAFT)
                .build();
        projectRepository.save(project2);

        // Create BOQ for Project 2
        BillOfQuantities boq2 = BillOfQuantities.builder()
                .project(project2)
                .originalFilename("parnu_mnt_15_boq.xlsx")
                .build();
        boqRepository.save(boq2);

        // Add BOQ items for Project 2
        createBoqItem(boq2, "1.1", "Betoon C25/30", "betoon", new BigDecimal("120"), "m³", "Vundament ja parkla");
        createBoqItem(boq2, "1.2", "Betoon C30/37", "betoon", new BigDecimal("85"), "m³", "Vahelaed");
        createBoqItem(boq2, "2.1", "Armatuur B500B", "teras", new BigDecimal("8500"), "kg", "Raudbetoon konstruktsioonid");
        createBoqItem(boq2, "3.1", "Aknad PVC 3-klaas", "aknad", new BigDecimal("96"), "tk", "Korterite aknad");
        createBoqItem(boq2, "3.2", "Rõduuksed PVC", "aknad", new BigDecimal("24"), "tk", "Rõduuksed klaasiga");
        createBoqItem(boq2, "4.1", "Fassaadikivi klinker", "fassaad", new BigDecimal("580"), "m²", "Fassaadiviimistlus");
        createBoqItem(boq2, "5.1", "Soojustus kivivill 200mm", "soojustus", new BigDecimal("640"), "m²", "Välisseinte soojustus");
        createBoqItem(boq2, "6.1", "Katus valtsplekk", "katus", new BigDecimal("420"), "m²", "Viilkatus");
        createBoqItem(boq2, "7.1", "Korterite siseuksed", "uksed", new BigDecimal("72"), "tk", "Lamineeritud uksed");
        createBoqItem(boq2, "8.1", "Elektrikilbid korteritele", "elekter", new BigDecimal("24"), "tk", "Rühmakeskused");

        // Create RFQ requests for Project 1
        RfqRequest rfq1 = RfqRequest.builder()
                .project(project1)
                .supplier(betoonimeister)
                .status(RfqStatus.RESPONDED)
                .sentAt(LocalDateTime.now().minusDays(5))
                .deadline(LocalDateTime.now().plusDays(10))
                .build();
        rfqRequestRepository.save(rfq1);

        RfqRequest rfq2 = RfqRequest.builder()
                .project(project1)
                .supplier(terasmarket)
                .status(RfqStatus.SENT)
                .sentAt(LocalDateTime.now().minusDays(3))
                .deadline(LocalDateTime.now().plusDays(14))
                .build();
        rfqRequestRepository.save(rfq2);

        RfqRequest rfq3 = RfqRequest.builder()
                .project(project1)
                .supplier(aknaexpert)
                .status(RfqStatus.DECLINED)
                .sentAt(LocalDateTime.now().minusDays(7))
                .deadline(LocalDateTime.now().plusDays(7))
                .build();
        rfqRequestRepository.save(rfq3);
    }

    private Supplier createSupplier(User user, String companyName, String contactName,
                                    String email, String phone, List<String> categories, String notes) {
        Supplier supplier = Supplier.builder()
                .user(user)
                .companyName(companyName)
                .contactName(contactName)
                .email(email)
                .phone(phone)
                .categories(categories)
                .notes(notes)
                .build();
        return supplierRepository.save(supplier);
    }

    private void createBoqItem(BillOfQuantities boq, String itemNumber, String description,
                               String materialType, BigDecimal quantity, String unit, String specification) {
        BoqItem item = BoqItem.builder()
                .billOfQuantities(boq)
                .itemNumber(itemNumber)
                .description(description)
                .materialType(materialType)
                .quantity(quantity)
                .unit(unit)
                .specification(specification)
                .build();
        boqItemRepository.save(item);
    }

    public boolean isDemoDataLoaded(User user) {
        return supplierRepository.countByUser(user) > 0;
    }
}
