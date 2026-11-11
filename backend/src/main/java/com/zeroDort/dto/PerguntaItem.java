package com.zeroDort.dto;

import java.util.List;

public record PerguntaItem(
        String CodigoPergunta,
        String RespostaId,
        List<String> regiao
) {}
