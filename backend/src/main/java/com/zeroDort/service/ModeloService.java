package com.zeroDort.service;

import com.zeroDort.dto.Perguntas;
import com.zeroDort.model.Corpo;
import com.zeroDort.model.Modelo;
import com.zeroDort.model.Usuario;
import com.zeroDort.repository.CorpoRepository;
import com.zeroDort.repository.ModeloRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ModeloService {

    @Autowired
    private ModeloRepository modeloRepository;

    @Autowired
    private CorpoRepository corpoRepository;

    public void cadastrarModelo(Usuario usuario, List<Perguntas> perguntas) {
        for (Perguntas p : perguntas) {
            // Se a pergunta tiver uma região (ex: "lombar"), buscamos ou criamos no banco
            if (p.regiao() != null && !p.regiao().isEmpty()) {
                Corpo corpo = corpoRepository.findByNome(p.regiao())
                        .orElseGet(() -> {
                            Corpo novoCorpo = new Corpo();
                            novoCorpo.setNome(p.regiao());
                            return corpoRepository.save(novoCorpo);
                        });

                // Salva o modelo ligando o usuário, a região e a pontuação
                Modelo modelo = Modelo.builder()
                        .usuario(usuario)
                        .corpo(corpo)
                        .pontuacao(p.pontuacao())
                        .dataAvaliacao(LocalDateTime.now())
                        .build();

                modeloRepository.save(modelo);
            }
        }
    }
}