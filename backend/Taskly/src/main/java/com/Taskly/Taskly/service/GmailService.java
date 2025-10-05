package com.Taskly.Taskly.service;

import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.googleapis.auth.oauth2.GoogleCredential;
import com.google.api.client.json.jackson2.JacksonFactory;
import com.google.api.services.gmail.Gmail;
import com.google.api.services.gmail.model.ListMessagesResponse;
import com.google.api.services.gmail.model.Message;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class GmailService {

    private static final String APPLICATION_NAME = "Taskly Gmail Fetcher";
    private static final String USER_ID = "me"; // "me" refers to authenticated user

    private Gmail getGmailService() throws Exception {
        GoogleCredential credential = GoogleCredential.fromStream(
                getClass().getResourceAsStream("/credentials.json")
        ).createScoped(List.of("https://www.googleapis.com/auth/gmail.readonly"));

        return new Gmail.Builder(
                GoogleNetHttpTransport.newTrustedTransport(),
                JacksonFactory.getDefaultInstance(),
                credential
        ).setApplicationName(APPLICATION_NAME).build();
    }

    public List<Message> fetchEmails(String subjectKeyword, String sender) throws Exception {
    Gmail service = getGmailService();

    String query = "";
    if (subjectKeyword != null && !subjectKeyword.isEmpty()) {
        query += "subject:" + subjectKeyword + " ";
    }
    if (sender != null && !sender.isEmpty()) {
        query += "from:" + sender;
    }

    ListMessagesResponse response = service.users().messages().list(USER_ID)
            .setQ(query.trim())
            .execute();

    List<Message> messages = new ArrayList<>();
    if (response.getMessages() != null) {
        for (Message msg : response.getMessages()) {
            messages.add(service.users().messages().get(USER_ID, msg.getId()).execute());
        }
    }
    return messages;
}

}
