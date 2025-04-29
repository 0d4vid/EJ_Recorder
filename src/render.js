const sourceSelect = document.getElementById('sourceSelect');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const previewVideo = document.getElementById('preview');

let mediaRecorder; // instance pour l'enregistrement
const recordedChunks = [];
let selectedSourceId = null;
let stream = null;

// Fonction pour sélectionner une source
async function populateSourceSelect(){
    sourceSelect.innerHTML = '<option value="">-- Choisir une source --</option>';
    try {
        const sources = await window.electronAPI.getSources();
        sources.forEach(source => {
            const option = document.createElement('option');
            option.value = source.id;
            option.innerText = source.name;
            sourceSelect.appendChild(option);
        });
    } catch(error){
        console.error ("Erreur lors de la recupration des sources: ", error );
        alert("Impossible de recuperer les sources");
    }
}

//Fonction pour le preview
async function startPreview(){
    selectedSourceId = sourceSelect.value;
    if(!selectedSourceId){
        alert("Veuillez selectionner une source!")
        return;
    }

    console.log(`tentative de caputure de la source: ${selectedSourceId}`);

    //Arreter le flux precedent
    if (stream){
        stream.getTracks().forEach(track => track.stop());
    }
    if (previewVideo.srcObject){
        previewVideo.srcObject.getTracks().forEach(track => track.stop());
        previewVideo.srcObject = null;
    }

    try{
        //Utilise l'api Web standard pour acceder aux sources via leur id
        stream = await navigator.mediaDevices.getUserMedia({
            audio: false, //desactiver l'audio
            video: {
                mandatory: {
                    chromeMediaSource: 'desktop',
                    chromeMediaSourceId: selectedSourceId,
                    //resolution
                    // minWidth: 1280,
                    // minHeight: 720,
                }
            }
        });

        //Affiche le preview
        previewVideo.srcObject = stream;
        previewVideo.play().catch(e => console.error("Erreur lors de la lecture du preview: ", e));

        //si le preview fonctionne, on peut commencer à enregistrer
        startBtn.disabled = false;
        stopBtn.disabled = true;
    } catch(e){
        console.error("Erreur getUserMedia: ", e);
        alert(`Impossible d'acceder a la source selectionnee. \nErrur: ${e.message}`);

        //reinitialise en cas d'erreur
        startBtn.disabled = true;
        stopBtn.disabled = true;
        previewVideo.srcObject = null;
        stream = null;
    }
}

//Fonction pour commencer l'enregistrement
function startRecording(){
    if(!stream){
        alert("Aucun flux de capture n'est selectionne. Veuillez en selectionner une et assurer qu'il est actif grace au preview.");
        return;
    }

    recordedChunks.length = 0; //vide le tableau des morceau precedemment enregistre

    //option pour l'enregistrement
    const options = {mimeType: 'video/webm; codecs=vp9'};
    try{
        mediaRecorder = new MediaRecorder(stream, options);
    } catch(e){
        console.error("Erreur creation du MediaRecorder: ", e);

        try{
            //en cas d'erreur, on essaye sans options specifiques
            console.warn("Tentative de creation MediaRecorder sans options mimeType specifiques.");
            mediaRecorder = new MediaRecorder(stream);
        } catch(e2){
            console.error("Echec de la creation du MediaRecorder: ", e2);
            alert(`Impossible de créer le MediaRecorder. Votre systeme supporte-t-il l'enregistrement WebM ? \nErreur: ${e2.message}`);
            return;
        }
    } 

    mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0){
            recordedChunks.push(event.data);
            console.log("Chunk reçu, taille: ",event.data.size);
        }
    };

    //Evenement declencher lorsque l'enregistrement s'arrete
    mediaRecorder.onstop = handleStop;

    // Demarre l'enregistrement avec un intervalle de temps de 10ms
    mediaRecorder.start(10);

    startBtn.disabled = true;
    stopBtn.disabled = false;
    sourceSelect.disabled = true;

    console.log("Enregistrement démarré");
}

//Fonction appelee lorsque l'enregistrement s'arrete
async function handleStop(){
    console.log("Enregistrement arrete. Chunks collectés: ", recordedChunks.length);

    //Creation du blob a partir des chunks recuperes et enregistrement sur le disque
    const blob = new Blob(recordedChunks, {
        type: 'video/webm'
    });

    //url temporaire pour le telechargement
    const url = URL.createObjectURL(blob);

    //Telechargement invisible
    const a = document.createElement('a');
    a.href = url;
    a.download = `enregistrement-${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click(); //simule un clic pour demarrer le telechargement
    
    //Nettoyage
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log("URL objet revoquee");
    }, 100);

    //reactive les boutons et le selecteur
    startBtn.disbled = false;
    stopBtn.disabled = true;
    sourceSelect.disabled = false;

    // Optionnel: arrêter la prévisualisation 
     // if (stream) {
     //    stream.getTracks().forEach(track => track.stop());
     //    previewVideo.srcObject = null;
     //    stream = null;
     //    startBtn.disabled = true; // Il faut re-sélectionner une source
     // }
}

// --- Event Handlers ---

window.addEventListener('load', populateSourceSelect);

//Demarre le preview lorsque la source est selectionnee
sourceSelect.addEventListener('change', startPreview);

//Lie les fonctions auc boutons
startBtn.addEventListener('click', startRecording);
stopBtn.addEventListener('click', () =>{
    if(mediaRecorder && mediaRecorder.state !== "innactive"){
        mediaRecorder.stop();
    }
});

// Desactiver le bouton demarrer au debut
startBtn.disabled = true;