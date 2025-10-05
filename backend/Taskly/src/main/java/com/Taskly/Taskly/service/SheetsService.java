package com.Taskly.Taskly.service;


import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.googleapis.auth.oauth2.GoogleCredential;
import com.google.api.client.json.jackson2.JacksonFactory;
import com.google.api.services.sheets.v4.Sheets;
import com.google.api.services.sheets.v4.model.ValueRange;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SheetsService {

    private static final String APPLICATION_NAME = "Taskly Sheets Writer";
    private static final String SPREADSHEET_ID = "1JBK9XT9ejPoNMfdiYFcFkL9xaAuJMI0r58bPMzaxxys";

    private Sheets getSheetsService() throws Exception {
        GoogleCredential credential = GoogleCredential.fromStream(
                getClass().getResourceAsStream("/credentials.json")
        ).createScoped(List.of("https://www.googleapis.com/auth/spreadsheets"));

        return new Sheets.Builder(
                GoogleNetHttpTransport.newTrustedTransport(),
                JacksonFactory.getDefaultInstance(),
                credential
        ).setApplicationName(APPLICATION_NAME).build();
    }

    public void writeToSheet(List<List<Object>> rows, String sheetName) throws Exception {
        Sheets service = getSheetsService();
        ValueRange body = new ValueRange().setValues(rows);
        service.spreadsheets().values()
                .append(SPREADSHEET_ID, sheetName + "!A1", body)
                .setValueInputOption("RAW")
                .execute();
    }
}
