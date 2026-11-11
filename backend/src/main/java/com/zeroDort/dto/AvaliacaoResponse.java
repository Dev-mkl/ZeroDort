package com.zeroDort.dto;

public record AvaliacaoResponse(
        Short estudiosoId,
        String chaveDeAcesso,
        Double scoreGlobal,
        Short posicao
) {
}
