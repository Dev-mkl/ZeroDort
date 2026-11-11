package com.zeroDort.repository;

import com.zeroDort.model.Resposta;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RespostaRepository extends JpaRepository<Resposta, Short> {
    Optional<Resposta> findByRespostaIdAndPergunta_Codigo(Short respostaId, String codigo);
}
