package com.zeroDort.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
        uniqueConstraints = @UniqueConstraint(
                name = "uk_resposta_corpo_resposta_corpo",
                columnNames = {"resposta_id", "corpo_id"}
        )
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RespostaCorpo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer respostaCorpoId;

    @ManyToOne(optional = false)
    @JoinColumn(name = "resposta_id", nullable = false)
    private Resposta resposta;

    @ManyToOne(optional = false)
    @JoinColumn(name = "corpo_id", nullable = false)
    private Corpo corpo;
}
