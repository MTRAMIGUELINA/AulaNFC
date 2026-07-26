const boton = document.getElementById("btnEscanear");
const estado = document.getElementById("estado");
const resultado = document.getElementById("resultado");

boton.addEventListener("click", iniciarNFC);

async function iniciarNFC(){

    if(!("NDEFReader" in window)){
        estado.innerHTML="❌ Este dispositivo no es compatible con Web NFC";
        return;
    }

    try{

        const ndef = new NDEFReader();

        await ndef.scan();

        estado.innerHTML="📡 Escáner activo. Acerca una tarjeta.";

        ndef.onreading = (event)=>{

            resultado.innerHTML="";

            if(event.serialNumber){

                resultado.innerHTML=
                "UID:<br><br><b>"+event.serialNumber+"</b>";

            }else{

                resultado.innerHTML=
                "Tarjeta detectada.";

            }

        };

    }
    catch(error){

        estado.innerHTML=
        "❌ "+error.message;

    }

}
