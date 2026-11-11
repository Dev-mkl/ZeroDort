package com.zeroDort.repository;

import com.zeroDort.model.RespostaCorpo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RespostaCorpoRepository extends JpaRepository<RespostaCorpo, Integer> {
    List<RespostaCorpo> findAllByResposta_RespostaId(Short respostaId);

    boolean existsByResposta_RespostaIdAndCorpo_Id(Short respostaId, Short corpoId);

    boolean existsByResposta_Pergunta_PerguntaId(Short perguntaId);
}
