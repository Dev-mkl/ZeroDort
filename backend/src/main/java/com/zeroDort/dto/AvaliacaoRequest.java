package com.zeroDort.dto;

import java.util.List;

public record AvaliacaoRequest(
        Short estudiosoId,
        List<PerguntaItem> perguntas
) {
}

