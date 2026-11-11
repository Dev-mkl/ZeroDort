package com.zeroDort.dto;

public record AvaliacaoResponse(
        Short usuarioId,
        String chaveDeAcesso,
        Double scoreGlobal,
        Short posicao
) {
}
