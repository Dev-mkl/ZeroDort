package com.zeroDort.repository;

import com.zeroDort.model.PerguntaCorpo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PerguntaCorpoRepository extends JpaRepository<PerguntaCorpo, Integer> {
    List<PerguntaCorpo> findAllByPergunta_PerguntaId(Short perguntaId);

    boolean existsByPergunta_PerguntaIdAndCorpo_Id(Short perguntaId, Short corpoId);
}
