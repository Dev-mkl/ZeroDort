package com.zeroDort.dto;

public record AvaliacaoResponse(
        Short estudiosoId,
        String chave,
        Short score,
        Short posicao
) {
}
