const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// servir frontend
app.use(express.static(path.join(__dirname, 'public')));

const pool = new Pool({
  user: 'postgres',
  host: 'localhost', // depois vamos trocar pro Supabase
  database: 'agencia',
  password: '123456',
  port: 5432,
});

const horariosValidos = ['10:00', '12:00', '14:00', '16:00', '18:00', '20:00'];

// rota inicial
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// criar agendamento
app.post('/agendar', async (req, res) => {
  const { nome, telefone, data, hora } = req.body;

  try {
    // valida horário
    if (!horariosValidos.includes(hora)) {
      return res.json({ erro: 'Horário inválido' });
    }

    // valida data
    const hoje = new Date();
    const dataEscolhida = new Date(data);

    const amanha = new Date();
    amanha.setDate(hoje.getDate() + 1);

    const limite = new Date();
    limite.setDate(hoje.getDate() + 10);

    if (dataEscolhida < amanha || dataEscolhida > limite) {
      return res.json({ erro: 'Data fora do permitido' });
    }

    // verifica se já existe
    const check = await pool.query(
      'SELECT * FROM agendamentos WHERE data=$1 AND hora=$2',
      [data, hora]
    );

    if (check.rows.length > 0) {
      return res.json({ erro: 'Horário já ocupado' });
    }

    // insere
    await pool.query(
      'INSERT INTO agendamentos (nome_cliente, telefone, data, hora) VALUES ($1, $2, $3, $4)',
      [nome, telefone, data, hora]
    );

    res.json({ sucesso: 'Agendado com sucesso' });

  } catch (err) {
    console.error(err);
    res.status(500).send('Erro no servidor');
  }
});

// horários ocupados
app.get('/horarios/:data', async (req, res) => {
  const { data } = req.params;

  try {
    const result = await pool.query(
      'SELECT hora FROM agendamentos WHERE data = $1',
      [data]
    );

    const ocupados = result.rows.map(r => r.hora);

    res.json({ ocupados });

  } catch (err) {
    console.error(err);
    res.status(500).send('Erro');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Servidor rodando');
});