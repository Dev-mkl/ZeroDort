package com.zeroDort.service;

import com.zeroDort.dto.ChaveAcessoRequest;
import com.zeroDort.model.ChaveAcesso;
import com.zeroDort.repository.ChaveAcessoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class ChaveAcessoService {
    @Autowired
    private ChaveAcessoRepository chaveAcessoRepository;

    public List<ChaveAcesso> buscarChaveAcessoDisponivel(){
        return chaveAcessoRepository.findAllByUtilizada(false);
    }

    public ChaveAcesso gerarChaveAcesso() {
        ChaveAcesso chaveAcesso = ChaveAcesso.builder()
                .codigo(UUID.randomUUID().toString())
                .utilizada(false)
                .build();
        return chaveAcessoRepository.save(chaveAcesso);
    }

    public boolean marcarChaveUtilizada(Short id) {
        ChaveAcesso chaveAcesso = chaveAcessoRepository.findById(id).orElseThrow(
                () -> new RuntimeException("Chave de acesso não encontrada")
        );

        chaveAcesso.setUtilizada(true);
        chaveAcessoRepository.save(chaveAcesso);
        return true;
    }

    /*public boolean cadastrarChaveAcesso(ChaveAcessoRequest chaveAcessoRequest){
        ChaveAcesso chaveAcesso = ChaveAcesso.builder()
                .codigo(chaveAcessoRequest.codigo())
                .build();
        chaveAcessoRepository.save(chaveAcesso);
        return true;
    }*/
}
