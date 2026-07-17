// ==========================================
// CONFIGURAÇÕES DE MARKUP - SAMAMBAIA
// ==========================================
const markupCategorias = {
    acrilicos: 70,
    baloes: 100,
    confeitaria: 80,
    descartaveis: 90,
    doces: 120,
    fantasia: 100,
    festas: 90,
    papelaria: 80
};

document.addEventListener('DOMContentLoaded', () => {
    const camposMoeda = document.querySelectorAll('.moeda');
    camposMoeda.forEach(campo => {
        campo.addEventListener('input', (e) => {
            formatarInputMoeda(e.target);
            
            // Se o campo alterado for o Preço de Venda, recalcula apenas a margem.
            // Caso contrário, atualiza a tela inteira.
            if(e.target.id === 'precoVendaSugerido') {
                recalcularMargemManual();
            } else {
                atualizarTela();
            }
        });
    });

    const inputsParaCalcular = ['quantidade', 'frete', 'ipi', 'st', 'categoria'];
    inputsParaCalcular.forEach(id => {
        document.getElementById(id).addEventListener('input', atualizarTela);
    });

    document.getElementById('btnLimpar').addEventListener('click', limparCampos);
    document.getElementById('btnCopiar').addEventListener('click', copiarResultado);

    document.getElementById('valorStNota').addEventListener('input', calcularHelperST);
    document.getElementById('valorTotalNotaSt').addEventListener('input', calcularHelperST);
});

// FUNÇÕES DE FORMATAÇÃO E PARSE
function formatarInputMoeda(input) {
    let value = input.value.replace(/\D/g, '');
    if (value === '') { 
        input.value = ''; 
        return; 
    }
    value = (parseInt(value) / 100).toFixed(2);
    value = value.replace('.', ',');
    value = value.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
    input.value = 'R$ ' + value;
}

function parseMoeda(str) {
    if (!str) return 0;
    let s = str.replace(/[^\d,-]/g, '');
    s = s.replace(/\./g, '');
    s = s.replace(',', '.');
    return parseFloat(s) || 0;
}

function formatarReal(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatarPercentual(valor) {
    return valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
}

function aplicarPrecoPsicologico(preco) {
    if (preco <= 0) return 0;
    const inteiro = Math.floor(preco);
    return inteiro + 0.99; 
}

function calcularHelperST() {
    const valorStNota = parseMoeda(document.getElementById('valorStNota').value);
    const valorTotalMercadoria = parseMoeda(document.getElementById('valorTotalNotaSt').value);

    if (valorTotalMercadoria > 0 && valorStNota >= 0) {
        // Arredondamento padrão para maior ou menor no percentual da ST
        const percentualCalculado = Math.round((valorStNota / valorTotalMercadoria) * 100);
        document.getElementById('st').value = percentualCalculado.toFixed(2);
        atualizarTela();
    }
}

// ATUALIZADOR PRINCIPAL
function atualizarTela() {
    const valorTotal = parseMoeda(document.getElementById('valorTotal').value);
    const quantidade = parseInt(document.getElementById('quantidade').value) || 0;
    const fretePct = parseFloat(document.getElementById('frete').value) || 0;
    const ipiPct = parseFloat(document.getElementById('ipi').value) || 0;
    const stPct = parseFloat(document.getElementById('st').value) || 0;
    const categoria = document.getElementById('categoria').value;

    if (valorTotal <= 0 || quantidade <= 0 || !categoria) {
        zerarResultados();
        return;
    }

    const valorUnitarioBase = valorTotal / quantidade;
    const valorFrete = (valorTotal * (fretePct / 100)) / quantidade;
    const valorIPI = (valorTotal * (ipiPct / 100)) / quantidade;
    
    // Regra de arredondamento da ST para o centavo maior ou menor
    let valorST = (valorTotal * (stPct / 100)) / quantidade;
    valorST = Math.round(valorST * 100) / 100; 
    
    const custoUnitario = valorUnitarioBase + valorFrete + valorIPI + valorST;
    
    const markup = markupCategorias[categoria] || 0;
    const precoCalculado = custoUnitario * (1 + (markup / 100));
    const precoVendaSugerido = aplicarPrecoPsicologico(precoCalculado);

    document.getElementById('resValorUnitarioBase').innerText = formatarReal(valorUnitarioBase);
    document.getElementById('resCustoUnitarioFinal').innerText = formatarReal(custoUnitario);
    document.getElementById('resMarkupPct').innerText = markup;
    
    // Atualiza o input editável e dispara o recalculo da margem
    document.getElementById('precoVendaSugerido').value = formatarReal(precoVendaSugerido);
    recalcularMargemManual();
}

// NOVA FUNÇÃO: Recalcula a Margem baseada no preço que o pai digitar
function recalcularMargemManual() {
    const custoUnitario = parseMoeda(document.getElementById('resCustoUnitarioFinal').innerText);
    const precoEditado = parseMoeda(document.getElementById('precoVendaSugerido').value);
    const caixaMargem = document.getElementById('caixaMargem');
    
    if (precoEditado > 0 && custoUnitario > 0) {
        const margemRealPct = ((precoEditado - custoUnitario) / precoEditado) * 100;
        document.getElementById('resMargemReal').innerText = formatarPercentual(margemRealPct);
        
        // Alerta visual de Prejuízo (Fica vermelho se a margem for zero ou negativa)
        if (margemRealPct <= 0) {
            caixaMargem.style.backgroundColor = '#DC3545'; // Vermelho
            caixaMargem.style.boxShadow = '0 8px 20px rgba(220, 53, 69, 0.3)';
        } else {
            caixaMargem.style.backgroundColor = '#137333'; // Verde
            caixaMargem.style.boxShadow = '0 8px 20px rgba(19, 115, 51, 0.3)';
        }
    } else {
        document.getElementById('resMargemReal').innerText = '0,00%';
        caixaMargem.style.backgroundColor = '#137333';
    }
}

function zerarResultados() {
    document.getElementById('resValorUnitarioBase').innerText = 'R$ 0,00';
    document.getElementById('resCustoUnitarioFinal').innerText = 'R$ 0,00';
    document.getElementById('resMarkupPct').innerText = '0';
    document.getElementById('resMargemReal').innerText = '0,00%';
    document.getElementById('precoVendaSugerido').value = 'R$ 0,00';
    document.getElementById('caixaMargem').style.backgroundColor = '#137333';
}

function limparCampos() {
    document.querySelectorAll('input').forEach(input => input.value = '');
    document.getElementById('categoria').value = '';
    zerarResultados();
    document.getElementById('valorTotal').focus();
}

function copiarResultado() {
    const categoriaSelect = document.getElementById('categoria');
    const nomeCategoria = categoriaSelect.options[categoriaSelect.selectedIndex]?.text || 'Não selecionada';
    const precoVendaAtual = document.getElementById('precoVendaSugerido').value;
    
    if (precoVendaAtual === 'R$ 0,00' || precoVendaAtual === '') {
        alert('Pai, preencha os dados primeiro para copiar os valores!');
        return;
    }

    const texto = `*SAMAMBAIA FESTAS* 🦊
Categoria: ${nomeCategoria}
Custo Final na Loja: ${document.getElementById('resCustoUnitarioFinal').innerText}
Margem Real de Lucro: ${document.getElementById('resMargemReal').innerText}

*PREÇO DE VENDA:* ${precoVendaAtual}`;

    navigator.clipboard.writeText(texto).then(() => {
        const btn = document.getElementById('btnCopiar');
        const textoOriginal = btn.innerText;
        btn.innerText = '✅ Resumo Copiado!';
        btn.style.backgroundColor = '#137333';
        btn.style.color = '#fff';
        
        setTimeout(() => {
            btn.innerText = textoOriginal;
            btn.style.backgroundColor = 'var(--brand-dark)';
            btn.style.color = 'var(--brand-yellow)';
        }, 2500);
    });
}