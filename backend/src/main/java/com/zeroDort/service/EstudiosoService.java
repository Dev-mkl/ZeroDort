package com.zeroDort.service;

import com.zeroDort.dto.EstudiosoRequest;
import com.zeroDort.model.Estudioso;
import com.zeroDort.repository.EstudiosoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EstudiosoService {
    @Autowired
    private EstudiosoRepository estudiosoRepository;

    public List<Estudioso> getTodosEstudiososDisponiveis(){
        return estudiosoRepository.findAllByDisponivel(true);
    }

    public boolean cadastrarEstudioso(EstudiosoRequest estudiosoRequest){
        Estudioso estudioso = Estudioso.builder()
                .nome(estudiosoRequest.nome())
                .descricao(estudiosoRequest.descricao())
                .build();

        estudiosoRepository.save(estudioso);
        return true;
    }

    public Estudioso buscarEstudioso(Short estudiosoId) {
        return estudiosoRepository.findById(estudiosoId)
                .orElseThrow(() -> new RuntimeException("Estudioso não encontrado!"));
    }
}
