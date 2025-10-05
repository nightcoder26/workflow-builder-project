package com.Taskly.Taskly.controller;

import com.google.api.services.gmail.model.Message;
import com.Taskly.Taskly.service.GmailService;
import com.Taskly.Taskly.service.SheetsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/workflow")
public class WorkflowController {

    @Autowired
    private GmailService gmailService;

    @Autowired
    private SheetsService sheetsService;

    @GetMapping("/fetch")
    public String fetchAndSaveEmails(@RequestParam String keyword, @RequestParam String sheetName) {
        try {
            List<Message> messages = gmailService.fetchEmails(keyword);
            List<List<Object>> rows = new ArrayList<>();

            for (Message msg : messages) {
                String subject = msg.getPayload().getHeaders().stream()
                        .filter(h -> h.getName().equalsIgnoreCase("Subject"))
                        .findFirst().map(h -> h.getValue()).orElse("");
                String sender = msg.getPayload().getHeaders().stream()
                        .filter(h -> h.getName().equalsIgnoreCase("From"))
                        .findFirst().map(h -> h.getValue()).orElse("");

                List<Object> row = List.of(sender, subject);
                rows.add(row);
            }

            sheetsService.writeToSheet(rows, sheetName);
            return "Emails saved to sheet successfully!";
        } catch (Exception e) {
            e.printStackTrace();
            return "Error: " + e.getMessage();
        }
    }
}
