package com.zeroDort.controller;

import com.zeroDort.dto.ChaveAcessoRequest;
import com.zeroDort.model.ChaveAcesso;
import com.zeroDort.service.ChaveAcessoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/chave")
public class ChaveAcessoController {

    @Autowired
    private ChaveAcessoService chaveAcessoService;

    @GetMapping
    public ResponseEntity<List<ChaveAcesso>> buscarChaveAcessoDisponivel(){
        List<ChaveAcesso> chavesDisponiveis = chaveAcessoService.buscarChaveAcessoDisponivel();
        return ResponseEntity.ok().body(chavesDisponiveis);
    }

  /*  @PostMapping
    public ResponseEntity<?> cadastrarChaveAcesso(
            @RequestBody ChaveAcessoRequest chaveAcessoRequest
    ){
        chaveAcessoService.cadastrarChaveAcesso(chaveAcessoRequest);
        return ResponseEntity.ok("Chave de acesso cadastrada com sucesso!");
    }*/
}
