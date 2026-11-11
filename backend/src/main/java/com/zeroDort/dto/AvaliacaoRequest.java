package com.zeroDort.dto;

import java.util.List;

public record AvaliacaoRequest(
        String nome,
        List<PerguntaItem> perguntas
) {
}
