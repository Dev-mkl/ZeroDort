package com.zeroDort.controller;

import com.zeroDort.dto.RankingResponse;
import com.zeroDort.service.UsuarioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/ranking")
public class RankingController {

    @Autowired
    private UsuarioService usuarioService;

    @GetMapping
    public ResponseEntity<?> buscarRanking() {
        List<RankingResponse> rankingResponse = usuarioService.gerarRanking();
        return ResponseEntity.ok().body(rankingResponse);
    }
}
