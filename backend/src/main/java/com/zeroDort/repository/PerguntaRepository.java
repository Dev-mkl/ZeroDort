package com.zeroDort.repository;

import com.zeroDort.model.Pergunta;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PerguntaRepository extends JpaRepository<Pergunta, Short> {
    Optional<Pergunta> findByCodigo(String codigo);
}
