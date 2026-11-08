package com.zeroDort.dto;

public record AvaliacaoResponse(
        String chave,
        Short score,
        Short posicao
) {
}
