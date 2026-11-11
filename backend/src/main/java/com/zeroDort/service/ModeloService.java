package com.zeroDort.service;

import com.zeroDort.model.Corpo;
import com.zeroDort.model.Modelo;
import com.zeroDort.model.Usuario;
import com.zeroDort.repository.CorpoRepository;
import com.zeroDort.repository.ModeloRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;

@Service
public class ModeloService {

    @Autowired
    private ModeloRepository modeloRepository;

    @Autowired
    private CorpoRepository corpoRepository;

    public void cadastrarModelo(Usuario usuario, Map<Short, Double> pontuacoesPorCorpo) {
        LocalDateTime dataAvaliacao = LocalDateTime.now();
        for (Map.Entry<Short, Double> pontuacaoPorCorpo : pontuacoesPorCorpo.entrySet()) {
            Corpo corpo = corpoRepository.findById(pontuacaoPorCorpo.getKey())
                    .orElseThrow(() -> new IllegalStateException(
                            "Região associada à pergunta não encontrada: " + pontuacaoPorCorpo.getKey()
                    ));

            Modelo modelo = Modelo.builder()
                    .usuario(usuario)
                    .corpo(corpo)
                    .pontuacao(pontuacaoPorCorpo.getValue())
                    .dataAvaliacao(dataAvaliacao)
                    .build();
            modeloRepository.save(modelo);
        }
    }
}