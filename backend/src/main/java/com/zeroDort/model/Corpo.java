package com.zeroDort.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "Corpo")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Corpo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Short id;

    @Column(nullable = false, length = 50)
    private String nome;
}
