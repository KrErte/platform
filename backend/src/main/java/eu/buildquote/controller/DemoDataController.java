package eu.buildquote.controller;

import eu.buildquote.entity.User;
import eu.buildquote.repository.UserRepository;
import eu.buildquote.service.DemoDataService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/demo")
@RequiredArgsConstructor
public class DemoDataController {

    private final DemoDataService demoDataService;
    private final UserRepository userRepository;

    @PostMapping("/load")
    public ResponseEntity<Map<String, Object>> loadDemoData(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        boolean alreadyLoaded = demoDataService.isDemoDataLoaded(user);
        if (alreadyLoaded) {
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Demo data already loaded",
                    "alreadyLoaded", true
            ));
        }

        demoDataService.loadDemoData(user);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Demo data loaded successfully",
                "alreadyLoaded", false
        ));
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getDemoDataStatus(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        boolean loaded = demoDataService.isDemoDataLoaded(user);

        return ResponseEntity.ok(Map.of(
                "loaded", loaded
        ));
    }
}
