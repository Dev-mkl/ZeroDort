package com.zeroDort.controller;

import com.zeroDort.dto.AvaliacaoRequest;
import com.zeroDort.model.ChaveAcesso;
import com.zeroDort.service.AvaliacaoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/avaliacao")
public class AvaliacaoController {

    @Autowired
    private AvaliacaoService avaliacaoService;

    @PostMapping
    public ResponseEntity<?> cadastrarAvaliacao(
            @RequestBody AvaliacaoRequest avaliacaoRequest
    ) {
        avaliacaoService.cadastrarAvaliacao(avaliacaoRequest);
        return ResponseEntity.ok("Avaliação cadastrada com sucesso!");
    }
}
