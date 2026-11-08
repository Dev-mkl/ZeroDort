package com.zeroDort.service;

import com.zeroDort.dto.ChaveAcessoRequest;
import com.zeroDort.model.ChaveAcesso;
import com.zeroDort.repository.ChaveAcessoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ChaveAcessoService {
    @Autowired
    private ChaveAcessoRepository chaveAcessoRepository;

    public List<ChaveAcesso> buscarChaveAcessoDisponivel(){
        return chaveAcessoRepository.findAllByUtilizada(false);
    }

    /*public boolean cadastrarChaveAcesso(ChaveAcessoRequest chaveAcessoRequest){
        ChaveAcesso chaveAcesso = ChaveAcesso.builder()
                .codigo(chaveAcessoRequest.codigo())
                .build();
        chaveAcessoRepository.save(chaveAcesso);
        return true;
    }*/
}
