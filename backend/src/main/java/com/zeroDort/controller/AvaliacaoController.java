package com.zeroDort.controller;

import com.zeroDort.dto.AvaliacaoRequest;
import com.zeroDort.dto.AvaliacaoResponse;
import com.zeroDort.service.AvaliacaoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/avaliacao")
public class AvaliacaoController {

    @Autowired
    private AvaliacaoService avaliacaoService;

    @PostMapping
    public ResponseEntity<AvaliacaoResponse> cadastrarAvaliacao(
            @RequestBody AvaliacaoRequest avaliacaoRequest
    ) {
        AvaliacaoResponse response = avaliacaoService.cadastrarAvaliacao(avaliacaoRequest);
        return ResponseEntity.ok(response); // Retorna a chave, score e posição
    }
}