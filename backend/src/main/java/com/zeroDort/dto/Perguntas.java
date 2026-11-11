package com.zeroDort.dto;

import java.util.List;

public record Perguntas(
        String CodigoPergunta,
        String CodigoResposta,
        List<String> regiao
) {}
