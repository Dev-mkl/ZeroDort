package com.zeroDort.controller;

import com.zeroDort.dto.EstudiosoRequest;
import com.zeroDort.model.Estudioso;
import com.zeroDort.service.EstudiosoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController()
@RequestMapping("/estudiosos")
public class EstudiosoController {

    @Autowired
    private EstudiosoService estudiosoService;

    @GetMapping
    public ResponseEntity<List<Estudioso>> getEstudiosos(){
        return ResponseEntity.ok().body(estudiosoService.getTodosEstudiososDisponiveis());
    }

    @PostMapping
    public ResponseEntity<?> postEstudiosos(@RequestBody EstudiosoRequest estudiosoRequest){
        boolean cadastro = estudiosoService.cadastrarEstudioso(estudiosoRequest);
        return ResponseEntity.ok("Estudioso cadastrado com sucesso!");
    }
}
