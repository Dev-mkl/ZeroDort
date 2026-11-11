package com.zeroDort.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PerguntaCorpo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int perguntaCorpoId;

    @OneToMany(cascade = CascadeType.ALL)
    @JoinColumn(name = "pergunta_id", nullable = false)
    private Pergunta pergunta;

    @OneToMany(cascade = CascadeType.ALL)
    @JoinColumn(name = "corpo_id", nullable = false)
    private Corpo corpo;
}
