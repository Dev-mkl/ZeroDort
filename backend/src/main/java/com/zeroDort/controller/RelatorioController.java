package com.zeroDort.controller;

import com.zeroDort.service.RelatorioPdfService;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/relatorios")
public class RelatorioController {

    private final RelatorioPdfService relatorioPdfService;

    public RelatorioController(RelatorioPdfService relatorioPdfService) {
        this.relatorioPdfService = relatorioPdfService;
    }

    @GetMapping(value = "/{chaveDeAcesso}/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> baixarPdf(@PathVariable String chaveDeAcesso) {
        byte[] pdf = relatorioPdfService.gerar(chaveDeAcesso);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
                        .filename("relatorio-ergonomico.pdf", StandardCharsets.UTF_8)
                        .build().toString())
                .body(pdf);
    }
}
