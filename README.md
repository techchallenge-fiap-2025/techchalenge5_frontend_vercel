# Frontend de Sistema de Auxílio Escolar (Hackaton)

Este repositório contém a interface web do projeto desenvolvido para o Hackaton da pós-graduação em Full Stack Development da FIAP (Turma 2025). O foco principal é auxiliar professores e professoras do ensino público no dia a dia escolar, reduzindo a sobrecarga administrativa.

### Objetivo

Proporcionar uma interface amigável e eficiente que facilite o trabalho dos docentes, permitindo a organização de turmas, controle de presença e a criação simplificada de atividades avaliativas.

### Público-alvo

Com base na estrutura de dados e nos scripts de automação do projeto, a plataforma atende a quatro perfis principais:

**Administradores**: Responsáveis pela gestão macro do sistema, configuração de cursos e controle de acesso.

**Professores**: O público-alvo central do Hackaton. Utilizam a ferramenta para criar provas (PDF), gerenciar atividades, registrar frequências e lançar notas.

**Alunos**: Acessam a plataforma para consultar aulas, cronograma, realizar atividades e acompanhar seu progresso acadêmico.


---

### Equipe

| Nome | E-mail |
| --- | --- |
| Lucas Piran | [lucas13piran@gmail.com](mailto:lucas13piran@gmail.com) |
| Felipe Ragne Silveira | [frsilveira01@outlook.com](mailto:frsilveira01@outlook.com) |
| Lais Taine de Oliveira | [lais.taine@gmail.com](mailto:lais.taine@gmail.com) |
| Pedro Juliano Quimelo | [pedrojulianoquimelo@outlook.com](mailto:pedrojulianoquimelo@outlook.com) |

---

## Tecnologias utilizadas
* **Framework:** React (v18) com TypeScript.
* **Estilização:** Tailwind CSS (Design responsivo).
* **Ícones:** Lucide React.
* **Consumo de API:** Axios.
* **Build Tool:** Vite.



## Como Rodar o Projeto

### Pré-requisitos
* Node.js instalado (v18 ou superior).
* Backend em execução (disponível em: [techChalenge5_backend](https://github.com/techchallenge-fiap-2025/techChalenge5_backend)).

### Passo 1: Instalação
No terminal, dentro da pasta do projeto, execute:
```bash
npm install
```

### Passo 2: Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto com o seguinte conteúdo:

```bash
VITE_API_URL=http://localhost:3000
```

### Passo 3: Execução
Inicie o ambiente de desenvolvimento:

```bash
npm run dev
```

Acesse o link gerado (ex: http://localhost:5173) no seu navegador.

### Passo 4: Login
Você pode ter acesso à plataforma utilizando o seguinte login abaixo:

**Login:** admin@escola.com <br>
**Senha:** PlataformaEDC@2026 <br>

<img width="1906" height="908" alt="image" src="https://github.com/user-attachments/assets/5afd8df4-4fa7-42c4-a53d-260dc2e9836a" />



## Caso de Uso Real

### Visão do administrador

Ao logar, o administrador tem a visão do dashboard, onde pode ter dados gerais da plataforma.
<img width="1908" height="904" alt="image" src="https://github.com/user-attachments/assets/527124e4-322b-472e-a74f-91f17c0c2aa3" />


<br>
<br>

Na aba "alunos", o administrador tem acesso aos dados de todos os alunos cadastrados em ordem alfabética. Nesta seção, ele pode visualizar, inserir, editar e excluir alunos ao clicar nos ícones correspondentes ao lado de cada nome.
<img width="1910" height="906" alt="image" src="https://github.com/user-attachments/assets/9250bf11-98fe-4014-bef0-4aa683a4b889" />


<br>
<br>

Formulário de edição/atualização de alunos
<img width="1893" height="912" alt="image" src="https://github.com/user-attachments/assets/1921dc28-4420-4cb2-a364-1f0c2e62ba7f" />


<br>
<br>

O administrador também tem acesso à tela de visualização, edição, inserção e exclusão de professores. Ele pode procurar por um cadastro na lista por meio do filtro de busca.
<img width="1898" height="902" alt="image" src="https://github.com/user-attachments/assets/1a229e08-7d47-475a-afac-a0aa2a8081ca" />


<br>
<br>

Na seção dos "Responsáveis", o administrador tem acesso aos cadastros de pais e responsáveis de cada aluno. A interface mantém o padrão de telas para simplificar o acesso do usuário.
<img width="1904" height="905" alt="image" src="https://github.com/user-attachments/assets/1edddb73-4b76-4b92-b5b7-c094ed1b90ee" />


<br>
<br>

O administrador também pode cadastrar as turmas da escola, inserindo os alunos, disciplinas e professores correspondentes. Este cadastro é fundamental para que outros agentes (professores e alunos) visualizem notas, presenças e cronograma, entre outros.
<img width="1907" height="896" alt="image" src="https://github.com/user-attachments/assets/0ecb7e8f-70b3-4851-9c1e-a3880fd733ff" />
<img width="1890" height="912" alt="image" src="https://github.com/user-attachments/assets/431abf9a-065e-4d05-9567-e0e007879a82" />

<br>
<br>

Na aba "Matérias", o administrador pode visualizar, cadastrar, editar e excluir as disciplinas aplicadas na escola.
<img width="1907" height="893" alt="image" src="https://github.com/user-attachments/assets/498a3b7e-f4dd-473f-b349-327c69c8af4f" />

<br>
<br>

Em aulas, o administrador tem acesso ao cronograma de atividades agendados pelos professores e pode adicionar aulas, permitindo que professores tenham acesso ao seu cronograma e turma.
<img width="1898" height="906" alt="image" src="https://github.com/user-attachments/assets/d5096dc2-d078-4a50-936b-48654098c002" />

<br>


Ao clicar na aula ou atividade agendada, tem acesso ao cronograma diário, com a atividade inclusa. É importante ressaltar que o administrador pode excluir uma aula do cronograma, mas não pode inserir ou editar a atividade, já que esta ação é de responsabilidade do Professor, mantendo sua autonomia pedagógica.
<img width="1884" height="900" alt="image" src="https://github.com/user-attachments/assets/9e40b3c3-3cc1-42ef-892d-7a2e48cea2dc" />


### Visão do professor
O professor tem acesso à visualização das telas anteriores, mas só pode adicionar atividades e cursos correspondentes a sua disciplina e turma (previamente cadastradas por um administrador)
<img width="1884" height="901" alt="image" src="https://github.com/user-attachments/assets/c00d73bf-0ec9-4ea2-86ad-dadcbcb5aedb" />
<img width="1890" height="904" alt="image" src="https://github.com/user-attachments/assets/4ac6a996-dfc5-4d87-9e98-072c8d1dde6a" />


<br>
<br>

Ao clicar na aula sob sua responsabilidade (cadastrada previamente pelo administrador), ele tem acesso à lista de chamadas dos alunos e pode realizá-la diretamente pela plataforma.
<img width="1906" height="898" alt="image" src="https://github.com/user-attachments/assets/8afe6336-9a7d-4bac-8e4d-b5fb87602b68" />

<br>
<br>

O Professor também pode inserir as notas das atividades inseridas por ele, mas o professor só consegue fazer isso após a realização da chamada, reforçando a importância do registro de frequência dos alunos.
<img width="1909" height="898" alt="image" src="https://github.com/user-attachments/assets/76e20f60-c306-4f9e-828b-b9217a42bc85" />

<br>
<br>

Interface permite inserção das notas após a realização da frequência dos alunos.
<img width="1907" height="903" alt="image" src="https://github.com/user-attachments/assets/809b5710-c991-4525-9f44-6a38f4b27fe6" />

### Visão do aluno
O aluno pode visualizar cursos em que está cadastrado, cronograma de aulas, boletim e tem acesso ao andamento das aulas com um dashboard de dados. Em aulas, ele têm acesso ao calendário, onde pode visualizar horários de aulas, datas de provas e entregas de trabalho.
<img width="1882" height="900" alt="image" src="https://github.com/user-attachments/assets/297fb923-f227-4814-87a4-3d64bb410fb0" />

<br>
<br>
Em "Boletim", pode acompanhar frequência e notas de atividades.
<img width="1890" height="905" alt="image" src="https://github.com/user-attachments/assets/cbab4ab9-b69d-4441-bc62-f121d0d7ac2f" />

Em "Meu Aprendizado", tem acesso ao dashboard de total de cursos matriculados, em andamento e concluídos.
<img width="1905" height="896" alt="image" src="https://github.com/user-attachments/assets/2ee487ac-8435-4b9e-9ab3-b8ec44c8d2ed" />




## Relato de Experiência: Frontend

### Desafios:


**UX Educacional:** Criar uma interface intuitiva para mitigar a falta de recursos tecnológicos no ensino público.


**Sincronização:** Garantir a fluidez do fluxo desde o login até o uso das funcionalidades principais, como a geração de atividades.


## Melhorias Futuras (Roadmap):

**Gamificação:** Implementação de quizzes e sistemas de recompensas para aumentar a motivação.


**Inclusão Digital:** Desenvolvimento de funcionalidades voltadas para acesso remoto ou híbrido.



---

# Contatos

[lucas13piran@gmail.com](mailto:lucas13piran@gmail.com)

[frsilveira01@outlook.com](mailto:frsilveira01@outlook.com)

[lais.taine@gmail.com](mailto:lais.taine@gmail.com)

[pedrojulianoquimelo@outlook.com](mailto:pedrojulianoquimelo@outlook.com)
