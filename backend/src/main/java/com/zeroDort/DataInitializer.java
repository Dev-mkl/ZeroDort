package com.zeroDort;

import com.zeroDort.model.ChaveAcesso;
import com.zeroDort.model.Estudioso;
import com.zeroDort.repository.ChaveAcessoRepository;
import com.zeroDort.repository.EstudiosoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private EstudiosoRepository estudiosoRepository;

    @Autowired
    private ChaveAcessoRepository chaveAcessoRepository;

    @Override
    public void run(String... args) throws Exception {
        // 1. Cria um Estudioso padrão se o banco estiver vazio
        if (estudiosoRepository.count() == 0) {
            Estudioso estudioso = Estudioso.builder()
                    .nome("Estudioso Padrão")
                    .descricao("Avaliação de Ergonomia")
                    .build();
            estudiosoRepository.save(estudioso);
        }

        // 2. Cria algumas chaves de acesso para o sistema sortear
        if (chaveAcessoRepository.count() == 0) {
            for (int i = 1; i <= 5; i++) {
                ChaveAcesso chave = ChaveAcesso.builder()
                        .codigo("CHAVE-" + i)
                        .build();
                chaveAcessoRepository.save(chave);
            }
        }
    }
}