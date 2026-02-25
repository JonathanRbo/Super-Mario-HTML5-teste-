# 🍄 Super Mario (BETA)

Jogo de plataforma estilo Mario clássico, feito 100% com HTML5 Canvas + JavaScript vanilla. Sem dependências externas.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)

## 🎮 Como Jogar

| Tecla | Ação |
|-------|------|
| **← →** ou **A/D** | Mover |
| **↑**, **W** ou **Espaço** | Pular |
| **Shift** | Correr |
| **Enter** | Iniciar / Reiniciar |

**No celular:** Controles touch automáticos (botões direcionais + A/B).

## 🕹 Mecânicas

- **Pise nos inimigos** para derrotá-los (pule em cima)
- **Colete moedas** para ganhar pontos
- **Blocos "?"** contêm moedas ou cogumelos
- **Cogumelo** faz o Mario crescer (aguenta 1 hit extra)
- **Blocos de tijolo** podem ser quebrados quando grande
- **Chegue na bandeira** para completar a fase
- **3 vidas** — Game Over ao perder todas

## 🌍 Fases

| Fase | Nome | Descrição |
|------|------|-----------|
| 1-1 | **Green Hills** | Fase introdutória com terreno simples |
| 1-2 | **Underground** | Mais desafios, gaps e inimigos |
| 1-3 | **Dark World** | Fase difícil com muitos obstáculos |

## 👾 Inimigos

- **Goomba** — Anda para a esquerda, morre com um pisão
- **Koopa** — Pisão transforma em casco, casco pode ser chutado e derrota outros inimigos

## ⚙️ Tecnologias

- **HTML5 Canvas** — Renderização de toda a parte gráfica
- **Pixel Art via código** — Sprites desenhados com canvas primitives (sem imagens externas)
- **Web Audio API** — Efeitos sonoros gerados em tempo real (sem arquivos de áudio)
- **Touch API** — Controles para dispositivos móveis
- **requestAnimationFrame** — Game loop com timestep fixo (60 FPS)

## 🚀 Como Executar

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/mario.git
cd mario

# Abra diretamente no navegador
open index.html

# Ou use um servidor local
npx serve .
```

Funciona abrindo o `index.html` diretamente — sem necessidade de servidor.

## 📁 Estrutura

```
mario/
├── index.html          # Página principal
├── css/
│   └── style.css       # Estilos e controles touch
├── js/
│   └── game.js         # Engine completa do jogo (~1000 linhas)
└── README.md           # Documentação
```

## 📱 Responsivo

O jogo escala automaticamente para qualquer tela mantendo a proporção. Controles touch aparecem automaticamente em dispositivos móveis.

## 📄 Licença

MIT License — Fan game apenas para fins educacionais.
