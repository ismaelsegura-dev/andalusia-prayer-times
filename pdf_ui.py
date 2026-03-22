import streamlit as st
import os
import generador_horarios

st.set_page_config(
    page_title="Generador de Horarios | Ramadán 1447h",
    page_icon="🌙",
    layout="centered"
)

st.title("🌙 Generador de PDFs de Oración")
st.markdown("**Ramadán 1447h (2025/2026)**")
st.write("Genera al instante el PDF oficial con diseño bilingüe, horarios precisos y calendarios lunares exactos para tu comunidad.")

estilos_mezquitas = {
    "granada": "Fundación Mezquita de Granada",
    "sevilla": "Fundación Mezquita de Sevilla",
    "barcelona": "Fundación Mezquita de Barcelona"
}

# Invertir el diccionario para el selectbox
opciones = {v: k for k, v in estilos_mezquitas.items()}

ciudad_seleccionada = st.selectbox(
    "Selecciona la comunidad islámica:",
    options=list(opciones.keys())
)

st.markdown("---")

if st.button("Generar PDF Oficial", type="primary", use_container_width=True):
    llave_ciudad = opciones[ciudad_seleccionada]
    
    # Directorio temporal de salida
    out_dir = "outputs"
    os.makedirs(out_dir, exist_ok=True)
    
    archivo_salida = os.path.join(out_dir, f"Ramadan_1447_{llave_ciudad.capitalize()}.pdf")
    
    with st.spinner(f"Calculando y renderizando PDF para {llave_ciudad.capitalize()}..."):
        try:
            generador_horarios.generar_pdf(llave_ciudad, archivo_salida)
            
            st.success("✅ ¡El documento PDF se generó con éxito y sin errores!")
            
            # Mostrar botón de descarga
            with open(archivo_salida, "rb") as pdf_file:
                pdf_data = pdf_file.read()
                
            st.download_button(
                label=f"⬇️ Descargar PDF ({llave_ciudad.capitalize()})",
                data=pdf_data,
                file_name=f"Horarios_Ramadan_1447_{llave_ciudad.capitalize()}.pdf",
                mime="application/pdf",
                use_container_width=True
            )
            
        except Exception as e:
            st.error(f"❌ Error durante la generación: {e}")
            st.exception(e)
