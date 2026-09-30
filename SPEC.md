# SPEC.md — Plataforma Colaborativa de Produção de Vídeos

> **Status:** MVP — Especificação funcional e técnica  
> **Versão:** 1.0  
> **Objetivo:** servir como fonte de verdade para implementação do MVP  
> **Tipo de produto:** aplicação web colaborativa para planejamento, produção, gravação, edição, revisão, aprovação e publicação de vídeos curtos  
> **Foco inicial:** equipes pequenas de software house / marketing interno  
> **Formato prioritário de conteúdo:** Reels, TikTok e YouTube Shorts

---

# 1. Visão do Produto

A aplicação será uma plataforma colaborativa para organizar todo o processo de produção de vídeos de marketing, desde a ideia inicial até a publicação final.

O problema principal não é simplesmente gerenciar tarefas. A aplicação deve organizar um **workflow audiovisual**, contemplando detalhes específicos de uma produção de vídeo:

- ideias;
- objetivos do vídeo;
- roteiro;
- cenas;
- falas;
- planos de câmera;
- múltiplas câmeras;
- capturas de tela;
- B-roll;
- responsáveis;
- equipamentos;
- preparação da gravação;
- checklist;
- takes;
- continuidade;
- edição;
- versões;
- comentários;
- aprovação;
- publicação.

A aplicação deve permitir que uma equipe pequena centralize o conhecimento do processo, evitando que decisões importantes fiquem apenas em conversas informais.

---

# 2. Objetivos do MVP

O MVP deve permitir que uma pequena equipe:

1. registre rapidamente ideias de vídeos;
2. transforme uma ideia em uma produção estruturada;
3. organize roteiro, cenas e planos de gravação;
4. distribua responsabilidades;
5. agende gravações;
6. utilize checklists de preparação;
7. acompanhe a gravação cena por cena;
8. registre takes realizados;
9. organize o processo de edição;
10. mantenha versões de edição;
11. registre comentários de revisão com timestamp;
12. aprove ou solicite alterações;
13. acompanhe a publicação em diferentes plataformas;
14. visualize o status de todas as produções;
15. mantenha histórico básico das ações realizadas.

---

# 3. Não Objetivos do MVP

O MVP **não deve** tentar resolver os seguintes problemas:

- edição de vídeo dentro da plataforma;
- renderização;
- transcodificação;
- hospedagem de arquivos brutos de vídeo;
- armazenamento de dezenas de gigabytes de mídia;
- sincronização automática com Adobe Premiere;
- sincronização automática com After Effects;
- publicação automática em Instagram;
- publicação automática em TikTok;
- publicação automática em YouTube;
- analytics de redes sociais;
- geração automática de legendas;
- inteligência artificial para geração de roteiro;
- videoconferência;
- streaming;
- teleprompter avançado;
- revisão de vídeo frame a frame;
- substituição de Google Drive, OneDrive, NAS ou S3.

Arquivos grandes devem inicialmente ser representados através de **links externos**.

---

# 4. Público-Alvo Inicial

## 4.1 Equipes internas

Pequenas equipes que produzem vídeos sobre seus próprios produtos.

Exemplo:

- software houses;
- startups;
- equipes de produto;
- marketing interno;
- equipes técnicas que participam de conteúdo.

## 4.2 Futuro potencial

O produto poderá futuramente atender:

- pequenas agências;
- produtoras;
- social media;
- criadores de conteúdo em equipe;
- equipes comerciais;
- freelancers.

O MVP, entretanto, será otimizado para o uso interno de uma equipe pequena.

---

# 5. Princípios de Produto

## 5.1 Produção audiovisual primeiro

A aplicação não deve parecer um Jira genérico.

O domínio principal é **produção de vídeo**.

---

## 5.2 Simplicidade

A equipe deve conseguir abrir a aplicação e entender rapidamente:

- o que precisa ser feito;
- quem é responsável;
- qual é o próximo vídeo;
- qual é a próxima gravação;
- quais cenas faltam;
- qual produção está aguardando aprovação.

---

## 5.3 Informação no contexto certo

Informações devem ficar ligadas ao objeto correto.

Exemplo:

- instrução de câmera → Shot;
- fala → Scene;
- comentário de edição → EditVersion;
- equipamento → Shoot;
- responsável → VideoProject ou tarefa específica.

---

## 5.4 Mobile-friendly

A plataforma será utilizada durante gravações.

A experiência mobile deve ser boa especialmente para:

- Modo Gravação;
- checklist;
- consulta de roteiro;
- marcação de takes;
- observações rápidas.

---

# 6. Terminologia do Sistema

| Termo | Significado |
|---|---|
| Workspace | Espaço da equipe/empresa |
| Idea | Ideia ainda não convertida em produção |
| Video Project | Produção de um vídeo |
| Script | Estrutura narrativa do vídeo |
| Scene | Unidade lógica do roteiro |
| Shot | Plano/take planejado dentro de uma cena |
| Shoot | Sessão de gravação |
| Take | Tentativa gravada de determinado Shot |
| Asset | Link para material externo |
| Edit Version | Versão de edição |
| Review Comment | Comentário sobre uma versão |
| Approval | Aprovação da produção |
| Publication | Registro da publicação em uma plataforma |

---

# 7. Usuários e Papéis

O sistema deve permitir usuários autenticados através do Google.

## 7.1 Papéis do Workspace

### OWNER

Pode:

- gerenciar workspace;
- adicionar/remover usuários;
- alterar papéis;
- editar qualquer produção;
- excluir projetos;
- aprovar vídeos;
- configurar templates.

---

### ADMIN

Pode:

- gerenciar produções;
- gerenciar ideias;
- gerenciar usuários comuns;
- editar configurações operacionais;
- criar templates;
- aprovar vídeos.

Não pode:

- excluir o Workspace;
- transferir propriedade.

---

### MEMBER

Pode:

- visualizar todas as produções;
- criar ideias;
- criar produções;
- editar produções;
- comentar;
- participar de gravações;
- registrar takes;
- criar versões;
- atualizar publicações.

---

### VIEWER

Pode:

- visualizar produções;
- visualizar calendário;
- visualizar roteiros;
- visualizar versões;
- comentar na revisão (ADR-044).

Não pode editar conteúdo operacional.

---

# 8. Autenticação

## 8.1 Login

Métodos (ADR-040), cada um ativo só se configurado:

- Google OAuth;
- link mágico por e-mail (SMTP).

Não haverá senha local no MVP.

---

## 8.2 Primeiro acesso

Ao autenticar:

1. usuário faz login (Google ou link por e-mail);
2. sistema identifica seu e-mail;
3. se já pertencer a um Workspace, entra normalmente;
4. se possuir convite pendente, entra no Workspace;
5. caso contrário pode:
   - criar Workspace;
   - aguardar convite.

## 8.3 Distribuição

O produto é self-hosted e de código aberto (AGPL-3.0, ADR-039), rodando por imagem Docker (ADR-037). A instância do mantenedor fica em `https://takeops.dennerstorres.dev` (Coolify).

---

# 9. Workspace

Um Workspace representa a equipe ou empresa.

## Campos

```ts
Workspace {
  id
  name
  slug
  logoUrl?
  timezone
  createdAt
  updatedAt
}
```

Timezone deve ser configurável.

Sugestão inicial:

```text
America/Cuiaba
```

---

# 10. Dashboard

A Home deve fornecer visão rápida do processo.

## Componentes

### Próximas gravações

Mostrar:

- projeto;
- data;
- horário;
- participantes;
- status de preparação.

---

### Produções em andamento

Cards contendo:

- thumbnail opcional;
- título;
- status;
- responsáveis;
- data de gravação;
- próxima ação.

---

### Aguardando revisão

Mostrar vídeos que possuem versão pendente.

---

### Aguardando aprovação

Mostrar vídeos em estado `IN_REVIEW` ou equivalente.

---

### Ideias recentes

Exibir últimas ideias registradas.

---

### Indicadores simples

Exemplo:

```text
Ideias: 12
Pré-produção: 4
Gravação: 2
Edição: 3
Revisão: 1
Publicados: 18
```

Não implementar analytics complexo no MVP.

---

# 11. Caixa de Ideias

Ideias devem poder ser cadastradas rapidamente.

## Campos

```ts
Idea {
  id
  workspaceId

  title
  description?

  format?
  objective?
  product?
  audience?

  referenceUrl?
  notes?

  authorId

  status

  createdAt
  updatedAt
}
```

## Formatos sugeridos

```ts
IdeaFormat =
  | "TUTORIAL"
  | "SKETCH"
  | "DEMO"
  | "FEATURE"
  | "INSTITUTIONAL"
  | "EDUCATIONAL"
  | "BEHIND_THE_SCENES"
  | "OTHER"
```

---

## Status

```ts
IdeaStatus =
  | "NEW"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "DISCARDED"
  | "CONVERTED"
```

---

## Converter ideia em produção

A ação:

```text
Converter em vídeo
```

deve criar um `VideoProject`.

Dados relevantes da Idea devem ser copiados.

A Idea permanece registrada como `CONVERTED`.

---

# 12. Projetos de Vídeo

O `VideoProject` é o elemento central da aplicação.

## Modelo

```ts
VideoProject {
  id
  workspaceId

  title
  slug?

  description?

  objective?
  audience?
  product?

  format
  aspectRatio

  estimatedDurationSeconds?

  status
  priority

  thumbnailUrl?

  ownerId?

  plannedShootDate?
  plannedPublishDate?

  sourceIdeaId?

  createdById

  createdAt
  updatedAt
}
```

---

# 13. Status do Pipeline

Estados padrão:

```ts
VideoProjectStatus =
  | "IDEA"
  | "PRE_PRODUCTION"
  | "SCRIPTING"
  | "READY_TO_RECORD"
  | "RECORDING"
  | "EDITING"
  | "REVIEW"
  | "APPROVED"
  | "SCHEDULED"
  | "PUBLISHED"
  | "ARCHIVED"
```

---

## Fluxo principal

```text
IDEA
↓
PRE_PRODUCTION
↓
SCRIPTING
↓
READY_TO_RECORD
↓
RECORDING
↓
EDITING
↓
REVIEW
↓
APPROVED
↓
SCHEDULED
↓
PUBLISHED
```

O sistema não precisa impedir transições manuais, mas deve avisar quando uma etapa parece incompleta.

---

# 14. Kanban

Tela principal de produções.

Colunas:

- Ideias;
- Pré-produção;
- Roteiro;
- Pronto para gravar;
- Gravação;
- Edição;
- Revisão;
- Aprovado;
- Agendado;
- Publicado.

## Card

Mostrar:

- thumbnail;
- título;
- responsáveis;
- data da gravação;
- prioridade;
- alertas;
- status de checklist.

Deve permitir Drag & Drop.

Toda alteração de coluna deve atualizar `VideoProject.status`.

---

# 15. Estrutura da Página do Vídeo

A página de produção deve possuir navegação por abas.

Sugestão:

```text
Visão Geral
Roteiro
Cenas
Gravação
Edição
Revisão
Publicação
Atividade
```

---

# 16. Visão Geral do Vídeo

Mostrar:

- título;
- objetivo;
- produto;
- público;
- formato;
- duração estimada;
- status;
- prioridade;
- data planejada de gravação;
- data planejada de publicação;
- participantes;
- responsáveis;
- links importantes;
- progresso.

---

# 17. Participantes e Responsabilidades

Um projeto pode possuir vários membros com funções diferentes.

## Modelo

```ts
ProjectMember {
  id
  videoProjectId
  userId

  role

  createdAt
}
```

## Funções

```ts
ProjectRole =
  | "PRODUCER"
  | "DIRECTOR"
  | "SCRIPT_WRITER"
  | "PRESENTER"
  | "CAMERA"
  | "EDITOR"
  | "REVIEWER"
  | "APPROVER"
  | "OTHER"
```

Um usuário pode possuir múltiplas funções.

---

# 18. Roteiro

O roteiro não deve ser um único campo de texto.

Ele deve ser estruturado em cenas.

## Script

```ts
Script {
  id
  videoProjectId

  hook?
  mainMessage?
  cta?

  notes?

  createdAt
  updatedAt
}
```

## 18.1 Arquivo do roteiro (markdown)

O roteiro sai e entra do app como um arquivo `.md` (ADR-046). O mesmo formato serve para exportar, para o modelo que quem escreve baixa na aba Roteiro e para a importação (SCRIPT-004).

- `# Título` na primeira linha: título da produção.
- Campos: linha `**Campo:** valor`. Valor longo continua nas linhas de baixo até uma linha em branco; dentro do valor, linha em branco vira quebra simples.
- Antes da primeira cena: Formato, Proporção, Duração, Objetivo, Público, Produto, Descrição (produção) e Gancho, Mensagem principal, Chamada para ação, Notas (Script).
- `# Cena N — título`: cena. Campos: Tipo, Duração (ou Tempo), Personagens (lista separada por vírgula), Propósito, Ação, Câmera, Edição, Continuidade, Descrição, Fala.
- `## Plano N.N — nome` (ou `## Shot`): plano da cena. Campos: Tipo, Enquadramento, Ângulo, Assunto (ou Subject), Movimento, Câmera, Takes, Propósito, Descrição, Notas.
- Rótulos de campo e de tipo são aceitos em português e em inglês, sem diferença de acento ou caixa. A exportação escreve no idioma de quem baixa.
- `**NOME:**` que não é campo (sozinho na linha ou em maiúsculas) é fala: vai para Fala da cena como `NOME: texto` e NOME entra nos personagens da cena. Complemento depois de travessão ou entre parênteses (`— OFF`, `(VOZ)`) não faz parte do nome.
- Texto solto vira descrição do plano, ou da cena antes do primeiro plano.
- Propósito não tem campo: vai para a descrição como `Propósito: valor`.
- Tipo livre (`dialogue`, `reaction`, `off`) vira o tipo mais próximo e o valor original fica na descrição; tipo desconhecido vira Outro com aviso.
- Duração aceita segundos (`15`), relógio (`0:15`), minutos (`2min20s`) e intervalo (`0:00 – 0:15`).
- Outro `# Título` (personagens, direção) e texto solto antes da primeira cena ficam como trechos à parte; a importação leva para as notas do roteiro. Comentário `<!-- -->` é ignorado.
- Não viajam no arquivo: quem fala (usuário do workspace), status, takes gravados e datas.

Exportar e importar o mesmo arquivo gera as mesmas cenas e planos.

### Importação

- Aba Roteiro → Importar roteiro: colar o texto ou escolher o `.md`. Só membro que edita (não leitor).
- Prévia antes de gravar: cenas e planos numerados como vão ficar, duração somada (cenas existentes + importadas) contra a duração da produção (ou a do arquivo, se a produção não tem), avisos do parser por linha e campos inválidos por cena/plano. Com campo inválido não importa.
- Grava numa transação: cenas ao fim da lista, planos na ordem do arquivo, tudo como Planejado e sem quem fala.
- Produção com cenas: exige confirmar que as novas entram depois. Nada é sobrescrito.
- Roteiro: gancho, mensagem e chamada só preenchem campo vazio; notas do arquivo e trechos à parte somam às notas existentes (teto de 4000 caracteres vale).
- Personagens do arquivo ligam ao personagem da produção com o mesmo nome (sem diferença de acento ou caixa); os que não existem são criados.
- Tetos por arquivo: 200 mil caracteres, 200 cenas, 1000 planos.
- Gera atividade `SCRIPT_IMPORTED` com o número de cenas e planos.

## 18.2 Elenco

Personagens da produção (ADR-047), mantidos na aba Roteiro.

```ts
ProjectCharacter {
  id
  videoProjectId
  name        // único na produção, sem diferença de acento ou caixa
  actorName?  // quem atua, com ou sem conta
  userId?     // pessoa do workspace, opcional
}

SceneCharacter { sceneId, characterId }
```

- Leitor vê o elenco; quem edita cria, renomeia e exclui. Excluir tira o personagem das cenas e não mexe em falas.
- A cena escolhe seus personagens na edição.
- Lista de cenas e Modo Gravação filtram por personagem, na ordem das cenas, para gravar por ator.
- Quem fala (`speakerId`) continua existindo: é a pessoa do workspace que apresenta a cena, não o personagem.

---

# 19. Cenas

## Modelo

```ts
Scene {
  id
  videoProjectId

  order

  title
  description?

  type

  speakerId?

  dialogue?

  action?

  estimatedDurationSeconds?

  cameraInstructions?
  editingInstructions?
  continuityNotes?

  status

  createdAt
  updatedAt
}
```

---

## Tipos

```ts
SceneType =
  | "HOOK"
  | "TALKING_HEAD"
  | "DIALOGUE"
  | "SCREEN_CAPTURE"
  | "BROLL"
  | "PRODUCT"
  | "VOICE_OVER"
  | "CTA"
  | "OTHER"
```

---

## Status

```ts
SceneStatus =
  | "PLANNED"
  | "READY"
  | "RECORDING"
  | "RECORDED"
  | "NEEDS_RETAKE"
  | "DISCARDED"
```

---

## Ordenação

Usuário deve conseguir:

- arrastar cenas;
- alterar ordem;
- duplicar;
- excluir;
- marcar como concluída.

---

# 20. Shots

Uma Scene pode possuir vários Shots.

Exemplo:

```text
Cena 04 — Demonstração

Shot A
Câmera frontal

Shot B
Close lateral

Shot C
Captura de tela

Shot D
B-roll do mouse
```

---

## Modelo

```ts
Shot {
  id
  sceneId

  order

  name?

  cameraLabel?
  shotType?
  framing?
  angle?
  subject?
  movement?

  description?

  requiredTakes
  notes?

  status

  createdAt
  updatedAt
}
```

---

## Tipos sugeridos

```ts
ShotType =
  | "CAMERA"
  | "SCREEN_CAPTURE"
  | "BROLL"
  | "INSERT"
  | "VOICE_ONLY"
  | "OTHER"
```

---

## Framing

Valores pré-definidos opcionais:

- Extreme Wide;
- Wide;
- Medium;
- Medium Close;
- Close;
- Extreme Close;
- Over Shoulder;
- POV;
- Screen.

Também permitir texto livre.

---

# 21. Takes

Durante a gravação, o usuário pode registrar Takes.

## Modelo

```ts
Take {
  id
  shotId

  number

  status

  notes?

  favorite

  recordedById?

  recordedAt
}
```

---

## Status

```ts
TakeStatus =
  | "OK"
  | "RETAKE"
  | "DISCARDED"
```

Pode haver mais de um Take `OK`.

Um take pode ser marcado como:

```text
⭐ Preferido
```

---

# 22. Sessões de Gravação

Uma produção pode possuir uma ou mais sessões.

## Modelo

```ts
Shoot {
  id
  videoProjectId

  title?

  scheduledAt
  endAt?

  location?

  status

  notes?

  createdAt
  updatedAt
}
```

---

## Status

```ts
ShootStatus =
  | "PLANNED"
  | "READY"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELED"
```

---

# 23. Equipamentos

Cada Shoot poderá possuir equipamentos planejados.

## Modelo

```ts
EquipmentItem {
  id
  workspaceId

  name
  category
  notes?
  active
}
```

Categorias:

- câmera;
- smartphone;
- microfone;
- tripé;
- iluminação;
- energia;
- notebook;
- outros.

---

## Equipment Requirement

```ts
ShootEquipment {
  id
  shootId
  equipmentItemId

  required
  checked
  notes?
}
```

---

# 24. Checklist de Gravação

Checklists devem ser baseados em templates.

## Checklist padrão

### Equipamentos

- Câmera A
- Câmera B
- Tripé
- Microfone
- Iluminação
- Extensão
- Carregadores
- Baterias
- Notebook
- Cabos necessários

### Preparação

- Limpar lentes
- Testar microfone
- Conferir enquadramento
- Conferir exposição
- Conferir foco
- Preparar cenário
- Silenciar celulares
- Fechar notificações do computador
- Preparar software/demo
- Conferir dados demonstrados
- Conferir roteiro
- Conferir espaço de armazenamento

---

## Modelo

```ts
ChecklistTemplate {
  id
  workspaceId

  name
  type

  createdAt
}
```

```ts
ChecklistTemplateItem {
  id
  checklistTemplateId

  order
  text
}
```

```ts
ShootChecklistItem {
  id
  shootId

  text
  order

  completed
  completedById?
  completedAt?
}
```

---

# 25. Continuidade

Cada projeto deve possuir uma área de continuidade.

Exemplo:

```text
João
- camiseta preta
- cadeira esquerda

Pedro
- camisa azul
- cadeira direita

Mesa
- notebook aberto
- celular à direita

Câmera A
- frontal

Câmera B
- lateral 45°
```

## Modelo

```ts
ContinuityNote {
  id
  videoProjectId

  category?
  title
  description

  createdById

  createdAt
  updatedAt
}
```

No futuro podem existir fotos de referência.

No MVP, texto e links são suficientes.

---

# 26. Modo Gravação

Deve existir uma interface simplificada e mobile-first.

Objetivo:

permitir acompanhar a gravação sem navegar por telas administrativas.

---

## Tela

Exemplo:

```text
🎬 GRAVAÇÃO

Cena 4 de 11

PEDRO

"Esse recurso permite acompanhar
todos os pedidos em tempo real."

Câmera A
Plano médio

Câmera B
Close lateral

Captura de tela
Dashboard > Pedidos

⚠ Deixar 2 segundos após a fala

TAKES

✓ Take 1 — OK
○ Take 2
○ Novo Take

[ ✓ Cena concluída ]

Anterior           Próxima
```

---

## Funcionalidades

- navegar entre cenas;
- visualizar fala;
- visualizar instruções;
- visualizar Shots;
- registrar Take;
- marcar Take preferido;
- adicionar observação;
- marcar cena gravada;
- marcar cena como `NEEDS_RETAKE`;
- avançar automaticamente para próxima cena;
- acompanhar progresso da gravação.

---

# 27. Assets

A plataforma não armazenará mídia pesada no MVP.

Será possível registrar referências externas.

## Modelo

```ts
Asset {
  id
  videoProjectId

  type

  title
  url

  description?

  createdById

  createdAt
}
```

---

## Tipos

```ts
AssetType =
  | "RAW_FOOTAGE"
  | "SCREEN_RECORDING"
  | "REFERENCE"
  | "AUDIO"
  | "IMAGE"
  | "PROJECT_FILE"
  | "FINAL_EXPORT"
  | "FOLDER"
  | "OTHER"
```

Links podem apontar para:

- Google Drive;
- OneDrive;
- Dropbox;
- NAS;
- S3;
- servidor interno;
- YouTube não listado;
- Frame.io;
- outros.

---

# 28. Edição

A plataforma deve gerenciar o processo, não editar vídeo.

## Dados

```ts
EditingInfo {
  id
  videoProjectId

  editorId?

  software?

  projectFileUrl?

  notes?

  targetResolution?
  targetFps?
  aspectRatio?

  captionsRequired
  musicRequired

  createdAt
  updatedAt
}
```

---

# 29. Versões de Edição

## Modelo

```ts
EditVersion {
  id
  videoProjectId

  versionNumber

  title?

  previewUrl?
  fileUrl?

  notes?

  createdById

  createdAt
}
```

Exemplo:

```text
V1
V2
V3
FINAL
```

O sistema deve gerar automaticamente o número sequencial.

---

# 30. Comentários de Revisão

Comentários pertencem a uma versão.

## Modelo

```ts
ReviewComment {
  id
  editVersionId

  authorId

  timestampSeconds?

  text

  resolved

  resolvedById?
  resolvedAt?

  createdAt
  updatedAt
}
```

---

## Timestamp

Usuário poderá informar:

```text
00:18
```

O sistema armazena:

```text
18 segundos
```

Exibição:

```text
00:18 — cortar essa pausa.
00:32 — usar câmera B.
01:04 — aumentar legenda.
```

---

## Estados

Comentário pode ser:

- aberto;
- resolvido.

---

# 31. Revisão

Página de revisão deve mostrar:

- versão atual;
- link para vídeo;
- comentários;
- comentários resolvidos;
- autor;
- timestamp;
- histórico de versões.

A aplicação não precisa tocar o vídeo sincronizado com os comentários no MVP.

---

# 32. Aprovação

O fluxo deve permitir:

```text
Solicitar alterações
```

ou

```text
Aprovar versão
```

---

## Modelo

```ts
Approval {
  id
  videoProjectId
  editVersionId

  status

  requestedById?
  reviewedById?

  notes?

  createdAt
  reviewedAt?
}
```

---

## Status

```ts
ApprovalStatus =
  | "PENDING"
  | "CHANGES_REQUESTED"
  | "APPROVED"
```

Ao aprovar:

```text
VideoProject.status = APPROVED
```

Ao solicitar alterações:

```text
VideoProject.status = EDITING
```

---

# 33. Publicação

Um vídeo pode ser publicado em várias plataformas.

## Modelo

```ts
Publication {
  id
  videoProjectId

  platform

  status

  scheduledAt?
  publishedAt?

  url?

  caption?
  notes?

  createdAt
  updatedAt
}
```

---

## Plataformas

```ts
Platform =
  | "INSTAGRAM_REELS"
  | "TIKTOK"
  | "YOUTUBE_SHORTS"
  | "YOUTUBE"
  | "LINKEDIN"
  | "FACEBOOK"
  | "OTHER"
```

---

## Status

```ts
PublicationStatus =
  | "PENDING"
  | "SCHEDULED"
  | "PUBLISHED"
  | "FAILED"
  | "CANCELED"
```

---

## Regra

Não haverá publicação automática no MVP.

Usuário registra manualmente:

- horário;
- URL;
- status.

---

# 34. Calendário

Tela calendário deve exibir:

- gravações;
- datas planejadas de publicação;
- publicações agendadas.

Visualizações:

- mês;
- semana.

Opcional no MVP:

- dia.

---

# 35. Templates de Produção

O sistema deverá permitir criar templates simples.

Exemplos:

## Demonstração de Feature

```text
1. Hook
2. Problema
3. Demonstração
4. Benefício
5. CTA
```

---

## Conversa entre Devs

```text
1. Hook
2. Pergunta
3. Resposta
4. Demonstração
5. CTA
```

---

## Modelo

```ts
ProductionTemplate {
  id
  workspaceId

  name
  description?

  createdById

  createdAt
  updatedAt
}
```

Templates podem possuir:

- cenas pré-configuradas;
- tipos de cena;
- checklist padrão.

---

# 36. Criação de Projeto por Template

Fluxo:

```text
Novo vídeo
↓
Escolher template
↓
Informar título
↓
Criar
```

O sistema duplica:

- cenas;
- estrutura;
- checklist relacionado.

---

# 37. Busca

Busca global básica por:

- título de projeto;
- ideia;
- produto;
- pessoa;
- texto de cena.

---

# 38. Filtros

Kanban/lista deve permitir filtros por:

- status;
- responsável;
- participante;
- produto;
- prioridade;
- data de gravação;
- data de publicação.

---

# 39. Prioridade

```ts
Priority =
  | "LOW"
  | "NORMAL"
  | "HIGH"
  | "URGENT"
```

Default:

```text
NORMAL
```

---

# 40. Notificações

MVP deve possuir notificações internas.

Exemplos:

- você foi adicionado a uma produção;
- gravação próxima;
- nova versão disponível;
- comentário criado;
- alteração solicitada;
- vídeo aprovado.

Não implementar push notification inicialmente.

---

# 41. Activity Log

A aplicação deverá registrar eventos importantes.

## Exemplos

```text
Denner criou o projeto.
João alterou o roteiro.
Pedro concluiu a Cena 4.
Denner adicionou a versão V2.
Daniel aprovou o vídeo.
```

---

## Modelo

```ts
ActivityLog {
  id
  workspaceId
  videoProjectId?

  userId?

  action
  entityType?
  entityId?

  metadata?

  createdAt
}
```

---

# 42. Exclusão

Preferir Soft Delete para entidades principais.

Exemplo:

```ts
deletedAt?: Date
```

Aplicável inicialmente a:

- Idea;
- VideoProject;
- Scene;
- Shot;
- Asset.

---

# 43. Requisitos de UX

## Desktop

Foco em:

- planejamento;
- roteiro;
- Kanban;
- edição;
- revisão.

---

## Mobile

Foco em:

- consulta;
- checklist;
- gravação;
- takes;
- comentários rápidos.

---

## Responsividade

Breakpoints devem funcionar corretamente em:

- smartphone;
- tablet;
- desktop.

---

# 44. Navegação Principal

Sugestão:

```text
Dashboard
Ideias
Produções
Calendário
Templates
Equipe
Configurações
```

---

# 45. Layout

Desktop:

```text
┌───────────────┬─────────────────────────────┐
│ Sidebar       │ Conteúdo                    │
│               │                             │
│ Dashboard     │                             │
│ Ideias        │                             │
│ Produções     │                             │
│ Calendário    │                             │
│ Templates     │                             │
│ Equipe        │                             │
│ Configuração  │                             │
└───────────────┴─────────────────────────────┘
```

Mobile:

- header;
- menu drawer;
- ações principais acessíveis;
- Modo Gravação em tela cheia.

---

# 46. Design

Direção:

- moderna;
- limpa;
- profissional;
- visual;
- pouco carregada;
- orientada a cards;
- dark mode opcional.

Evitar aparência excessivamente corporativa.

Referência conceitual:

```text
Linear
+
Notion
+
Frame.io
+
Trello
```

Sem copiar identidade visual.

---

# 47. Stack Recomendada

## Frontend

```text
Next.js
TypeScript
React
```

---

## UI

Sugestão:

```text
Tailwind CSS
shadcn/ui
Lucide Icons
```

---

## Backend

Opção recomendada para MVP:

```text
Next.js Server Actions / Route Handlers
```

Pode evoluir posteriormente para backend dedicado.

---

## Banco

```text
PostgreSQL
```

---

## ORM

```text
Prisma
```

ou equivalente.

---

## Autenticação

```text
Auth.js
Google OAuth
```

---

## Deploy

Possíveis ambientes:

Frontend/backend:

```text
Vercel
```

Banco:

```text
PostgreSQL gerenciado
```

ou infraestrutura própria.

---

# 48. Arquitetura

Arquitetura modular.

Sugestão:

```text
src/
├── app/
├── components/
├── modules/
│   ├── auth/
│   ├── workspace/
│   ├── ideas/
│   ├── projects/
│   ├── scripts/
│   ├── scenes/
│   ├── shots/
│   ├── shoots/
│   ├── checklists/
│   ├── editing/
│   ├── reviews/
│   ├── approvals/
│   ├── publications/
│   ├── templates/
│   └── notifications/
├── lib/
├── server/
└── types/
```

---

# 49. Multi-tenancy

Toda informação de negócio deve pertencer a um Workspace.

Regra fundamental:

```text
nenhum usuário pode acessar dados de outro Workspace.
```

Todas as queries precisam considerar:

```ts
workspaceId
```

Nunca confiar apenas no ID enviado pelo frontend.

---

# 50. Segurança

Obrigatório:

- autenticação;
- autorização por Workspace;
- validação server-side;
- sanitização;
- proteção contra acesso cross-workspace;
- proteção contra IDOR;
- validação de URLs;
- logs de ações críticas.

---

# 51. API

Mesmo usando Server Actions, regras devem estar organizadas como serviços.

Exemplo:

```text
createVideoProject()
updateVideoProject()
changeVideoProjectStatus()

createScene()
reorderScenes()

createShot()
registerTake()

createEditVersion()
createReviewComment()

approveVersion()
requestChanges()
```

UI não deve conter regras de negócio importantes.

---

# 52. IDs

Usar:

```text
UUID
```

ou:

```text
CUID2
```

Não utilizar IDs sequenciais expostos como identificador principal.

---

# 53. Datas

Persistência:

```text
UTC
```

Apresentação:

timezone do Workspace.

Formato de API:

```text
ISO 8601
```

---

# 54. Autosave

Campos extensos devem possuir autosave quando possível:

- roteiro;
- cenas;
- observações.

Sugestão:

debounce entre:

```text
500ms–1500ms
```

Interface deve mostrar:

```text
Salvando...
Salvo
Erro ao salvar
```

---

# 55. Concorrência

MVP não precisa de edição colaborativa em tempo real estilo Google Docs.

Entretanto:

- salvar alterações frequentemente;
- atualizar dados ao retornar à página;
- evitar sobrescritas silenciosas quando possível.

Realtime poderá ser adicionado futuramente.

---

# 56. Performance

Metas iniciais:

- dashboard < 2s em condições normais;
- navegação percebida instantânea;
- listas paginadas quando necessário;
- evitar carregamento desnecessário de histórico completo.

---

# 57. Acessibilidade

Mínimo:

- navegação por teclado;
- labels;
- contraste adequado;
- elementos clicáveis com tamanho adequado;
- sem depender exclusivamente de cor para status.

---

# 58. Auditoria

Registrar:

- criação;
- alteração de status;
- aprovação;
- solicitação de alteração;
- exclusão;
- publicação.

---

# 59. Seed Inicial

Desenvolvimento deve possuir Seed com:

Workspace:

```text
Acme Software
```

Usuários:

```text
Supervisor
Dev 1
Dev 2
Dev 3
```

Projetos exemplo:

```text
Novo módulo de estoque
Integração com WhatsApp
Dashboard financeiro
```

---

# 60. Projeto Demo

Criar um projeto demonstrativo completo.

Exemplo:

```text
"Conheça nosso novo Dashboard de Pedidos"
```

Com:

- 5 cenas;
- múltiplos Shots;
- duas câmeras;
- Screen Capture;
- checklist;
- dois participantes;
- três Takes;
- V1;
- comentários;
- publicação pendente.

Isso facilita testes de UX.

---

# 61. Critérios de Aceite — Autenticação

- [ ] login Google funciona;
- [ ] usuário sem sessão não acessa sistema;
- [ ] usuário acessa apenas Workspaces permitidos;
- [ ] logout funciona.

---

# 62. Critérios de Aceite — Ideias

- [ ] criar ideia;
- [ ] editar ideia;
- [ ] excluir ideia;
- [ ] alterar status;
- [ ] converter ideia em produção.

---

# 63. Critérios de Aceite — Produções

- [ ] criar projeto;
- [ ] editar projeto;
- [ ] alterar status;
- [ ] mover no Kanban;
- [ ] filtrar;
- [ ] pesquisar.

---

# 64. Critérios de Aceite — Roteiro

- [ ] criar cenas;
- [ ] editar cenas;
- [ ] reordenar;
- [ ] duplicar;
- [ ] excluir;
- [ ] definir fala;
- [ ] definir instruções.

---

# 65. Critérios de Aceite — Shots

- [ ] criar Shot;
- [ ] editar;
- [ ] reordenar;
- [ ] excluir;
- [ ] informar câmera;
- [ ] framing;
- [ ] requiredTakes.

---

# 66. Critérios de Aceite — Gravação

- [ ] criar Shoot;
- [ ] definir data;
- [ ] checklist funciona;
- [ ] equipamentos funcionam;
- [ ] modo gravação funciona em celular;
- [ ] registrar Take;
- [ ] marcar Take preferido;
- [ ] marcar cena concluída.

---

# 67. Critérios de Aceite — Edição

- [ ] definir editor;
- [ ] registrar software;
- [ ] registrar projeto externo;
- [ ] criar versões;
- [ ] histórico de versões.

---

# 68. Critérios de Aceite — Revisão

- [ ] comentar versão;
- [ ] informar timestamp;
- [ ] resolver comentário;
- [ ] solicitar alteração;
- [ ] aprovar.

---

# 69. Critérios de Aceite — Publicação

- [ ] adicionar plataforma;
- [ ] agendar;
- [ ] marcar publicado;
- [ ] informar URL;
- [ ] visualizar publicações da produção.

---

# 70. Critérios de Aceite — Calendário

- [ ] gravações aparecem;
- [ ] publicações aparecem;
- [ ] navegação por mês;
- [ ] clicar evento abre produção.

---

# 71. Critérios de Aceite — Permissões

- [ ] OWNER controla Workspace;
- [ ] ADMIN gerencia conteúdo;
- [ ] MEMBER colabora;
- [ ] VIEWER não altera conteúdo;
- [ ] autorização validada no servidor.

---

# 72. Critérios de Aceite — Mobile

Modo Gravação deve ser plenamente utilizável em:

```text
375px
390px
430px
```

sem scroll horizontal.

---

# 73. Telas do MVP

## Públicas

```text
/login
```

---

## Aplicação

```text
/dashboard

/ideas

/projects
/projects/[id]

/projects/[id]/script
/projects/[id]/recording
/projects/[id]/editing
/projects/[id]/review
/projects/[id]/publishing

/calendar

/templates

/team

/settings
```

Rotas podem ser adaptadas conforme arquitetura Next.js.

---

# 74. Estados Vazios

Todos os módulos devem possuir empty state útil.

Exemplo:

```text
Ainda não existem ideias.

Registre rapidamente qualquer ideia de vídeo
para não perder oportunidades.

[ Nova ideia ]
```

---

# 75. Confirmações

Ações destrutivas precisam de confirmação:

- excluir produção;
- excluir cena;
- excluir versão;
- remover usuário;
- descartar ideia.

---

# 76. Toasts

Exemplos:

```text
Projeto criado.
Cena atualizada.
Take registrado.
Versão V2 criada.
Vídeo aprovado.
```

---

# 77. Erros

Mensagens devem ser compreensíveis.

Evitar:

```text
Error 500.
```

Preferir:

```text
Não foi possível salvar a cena.
Tente novamente.
```

Detalhes técnicos ficam nos logs.

---

# 78. Logs Técnicos

Registrar erros backend com:

- request;
- user;
- workspace;
- entidade;
- stack trace.

Nunca registrar tokens OAuth.

---

# 79. Testes

## Unitários

Prioridade:

- permissões;
- status;
- conversão Idea → Project;
- aprovação;
- parsing de timestamp.

---

## Integração

Testar:

```text
login
criação projeto
cena
shot
take
versão
comentário
aprovação
```

---

## E2E

Fluxo principal:

```text
Login
↓
Criar ideia
↓
Converter
↓
Criar roteiro
↓
Preparar gravação
↓
Registrar takes
↓
Adicionar V1
↓
Comentar
↓
Adicionar V2
↓
Aprovar
↓
Registrar publicação
```

---

# 80. Roadmap Pós-MVP

Não implementar agora.

## V2

Possíveis recursos:

- anexos;
- upload de imagens;
- thumbnails;
- realtime;
- comentários com menções;
- notificações por e-mail;
- Google Calendar;
- Drive;
- OneDrive;
- biblioteca de equipamentos;
- fotos de continuidade;
- teleprompter;
- preview de vídeo;
- timecode sincronizado;
- upload de proxy.

---

## V3

Possíveis recursos:

- integração Adobe Premiere;
- Frame.io;
- aprovação externa;
- clientes convidados;
- IA para roteiro;
- IA para Shot List;
- IA para legenda;
- publicação automática;
- analytics;
- histórico de performance;
- sugestões baseadas em vídeos anteriores.

---

# 81. Possível SaaS Futuro

Arquitetura deve evitar bloquear evolução para SaaS.

Possíveis planos futuros:

```text
Free
Team
Pro
Agency
```

Possíveis limites:

- membros;
- projetos ativos;
- storage;
- templates;
- automações;
- integrações.

Nenhum sistema de cobrança será implementado no MVP.

---

# 82. Métricas de Sucesso Internas

O MVP deve responder positivamente:

1. ideias deixam de se perder?
2. roteiro fica mais organizado?
3. gravação exige menos improviso?
4. menos cenas precisam ser refeitas?
5. edição fica mais simples?
6. revisão fica centralizada?
7. todos sabem o estado de cada vídeo?
8. novos aprendizados viram processo?
9. preparação fica mais consistente?
10. equipe consegue produzir mais vídeos com menos atrito?

---

# 83. Definition of Done do MVP

O MVP estará funcional quando uma equipe conseguir realizar integralmente:

```text
IDEIA
↓
PLANEJAMENTO
↓
ROTEIRO
↓
SHOT LIST
↓
AGENDAMENTO
↓
CHECKLIST
↓
GRAVAÇÃO
↓
TAKES
↓
EDIÇÃO
↓
VERSÃO
↓
REVISÃO
↓
APROVAÇÃO
↓
PUBLICAÇÃO
```

sem precisar utilizar outra ferramenta de gerenciamento para organizar o processo.

Ferramentas externas continuarão sendo utilizadas apenas para:

- gravação;
- edição;
- armazenamento de mídia;
- publicação efetiva nas redes sociais.

---

# 84. Restrições do MVP

## Manter simples

Antes de implementar uma nova funcionalidade, perguntar:

> Ela ajuda diretamente a equipe a planejar, gravar, editar, revisar ou publicar um vídeo?

Se não, provavelmente pertence ao pós-MVP.

---

# 85. Prioridade de Desenvolvimento

## P0 — Essencial

```text
Auth
Workspace
Users
Ideas
Video Projects
Kanban
Scenes
Shots
Shoot
Checklist
Recording Mode
Takes
Edit Versions
Review Comments
Approval
Publications
```

---

## P1 — Importante

```text
Dashboard
Calendar
Templates
Activity Log
Notifications
Search
Filters
Continuity
Assets
```

---

## P2 — Depois

```text
Integrações
Uploads
Realtime
Automação
IA
Analytics
```

---

# 86. Decisões Técnicas que Não Devem ser Alteradas sem Motivo

1. PostgreSQL como banco principal.
2. TypeScript.
3. autenticação Google.
4. isolamento por Workspace.
5. Scene e Shot são entidades separadas.
6. mídia pesada não fica no sistema no MVP.
7. edição de vídeo não ocorre dentro da plataforma.
8. publicação é registrada, não executada.
9. timestamps armazenados em UTC.
10. datas trafegam em ISO 8601.
11. autorização deve ser validada no backend.
12. Modo Gravação precisa funcionar muito bem em mobile.

---

# 87. Perguntas que Devem Guiar a Implementação

Antes de cada feature:

```text
Isso reduz atrito da produção?
Isso evita informação perdida?
Isso melhora a gravação?
Isso melhora o handoff para edição?
Isso melhora revisão e aprovação?
Isso é realmente necessário no MVP?
```

---

# 88. Resultado Esperado

Ao abrir o sistema, qualquer membro da equipe deve ser capaz de descobrir rapidamente:

```text
O que estamos produzindo?
O que será gravado?
Quando será gravado?
Quem participa?
Qual é o roteiro?
Quais planos precisamos?
O que já foi gravado?
O que precisa ser refeito?
Quem está editando?
Qual é a versão atual?
O que precisa ser corrigido?
Está aprovado?
Onde e quando será publicado?
```

Se o produto responder bem essas perguntas, o MVP cumpriu sua função.
