package com.zeroDort.service;

import com.zeroDort.dto.Perguntas;
import com.zeroDort.model.Usuario;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ModeloService {
    public boolean cadastrarModelo(Usuario usuario, List<Perguntas> perguntas) {
        return true;
    }
}
