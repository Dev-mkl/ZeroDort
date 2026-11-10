package com.zeroDort.dto;

public record Perguntas(
        String pergunta,
        String regiao, // Ex: "lombar", "cervical"
        Short pontuacao
) {}
