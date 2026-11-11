package com.zeroDort.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record EstudiosoRequest(
    @NotBlank(message = "O campo nome não pode ser nulo ou vazio")
    String nome,
    @NotBlank(message = "O campo descricao não pode ser nulo ou vazio")
    String descricao
) {
}
