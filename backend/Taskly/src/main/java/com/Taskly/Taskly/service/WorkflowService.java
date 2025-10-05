package com.Taskly.Taskly.service;

import com.Taskly.Taskly.model.EmailData;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;

@Service
public class WorkflowService {

    private List<String[]> googleSheet = new ArrayList<>();

    public String processEmail(EmailData email) {
        System.out.println("📩 Email received from: " + email.getSender());
        System.out.println("Subject: " + email.getSubject());

        String[] row = { email.getSender(), email.getSubject(), email.getBody() };
        googleSheet.add(row);

        System.out.println("✅ Row added to Google Sheet simulation");
        return "Email processed and added to Google Sheet successfully!";
    }

    public List<String[]> getSheetData() {
        return googleSheet;
    }
}
