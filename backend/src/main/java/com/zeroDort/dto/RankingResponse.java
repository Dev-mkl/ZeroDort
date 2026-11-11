package com.zeroDort.dto;

public record RankingResponse(
        short posicao,
        String nome,
        double score
) {
}
