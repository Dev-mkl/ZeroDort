package com.zeroDort.controller;

import com.zeroDort.dto.NomeDisponibilidadeResponse;
import com.zeroDort.service.UsuarioService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/usuarios")
public class UsuarioController {

    private final UsuarioService usuarioService;

    public UsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @GetMapping("/disponibilidade")
    public ResponseEntity<NomeDisponibilidadeResponse> verificarDisponibilidade(
            @RequestParam String nome
    ) {
        return ResponseEntity.ok(new NomeDisponibilidadeResponse(usuarioService.isNomeDisponivel(nome)));
    }
}
