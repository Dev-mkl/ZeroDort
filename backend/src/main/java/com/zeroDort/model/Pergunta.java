package com.zeroDort.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Pergunta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Short perguntaId;

    private String codigo;

    @Column(nullable = false)
    private String enunciado;
}
