// For easily embedding models
//---------------------------
(function (Core)
{
    var embeds = [];
    var activeEmbed = null;
    var clock = new THREE.Clock();

    Core.EmbedConf =
    {
        Classname: "VoxiiEmbed",
        Background: "resources/embedBG.jpg",
        TransparentCanvas: true,
        Fov: 75

    };

    Core.CreateEmbeds = function()
    {
        console.log("CreateEmbeds");
        var elements = document.querySelectorAll('.'+ Core.EmbedConf.Classname);

        for (var i = 0; i < elements.length; i++)
        {
            CreateEmbed(Core.EmbedConf, elements[i]);
        }

        Update();
        Render();
    };

    function CreateEmbed(opts, parentElm)
    {
        var width = parentElm.clientWidth;
        var height = parentElm.clientHeight;

        var canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.style.zIndex = 5;

        var embed = CreateBasicStage(canvas);
        embed.clickDiv = CreateClickToLoadDiv(parentElm, embed);
        parentElm.appendChild(canvas);

        embed.conf = {
            modelPath: parentElm.getAttribute("data-VoxiiModel")
        };
        embeds.push(embed);
    }

    function CreateBasicStage(canvas)
    {
        var embed = {
            renderer: null,
            scene: null,
            camera: null,
            controls: null,
            voxModel: null
        };

        embed.renderer = new THREE.WebGLRenderer({canvas: canvas, antialias: true, alpha: Core.EmbedConf.TransparentCanvas});
        embed.renderer.setSize(canvas.width, canvas.height);
        embed.renderer.shadowMapEnabled = true;
        embed.renderer.shadowMapSoft = true;

        embed.scene = new THREE.Scene();

        embed.camera = new THREE.PerspectiveCamera(Core.EmbedConf.Fov, canvas.width / canvas.height, 5, 3000);
        embed.camera.position.set(-30, 20, 30);
        embed.camera.lookAt(embed.scene.position);

        // Set up controls
        embed.controls = new THREE.OrbitControls(embed.camera, canvas);
        embed.controls.damping = 0.2;
        embed.controls.addEventListener( 'change', function()
        {
            if (embed != activeEmbed)
                SetActiveEmbed(embed);

            Render();
        });

        var amblight = new THREE.AmbientLight(0x666666);
        amblight.color.setRGB(0.859 * 0.2, 0.976 * 0.2, 1 * 0.2);
        embed.scene.add(amblight);

        // Fill light
        var fill = new THREE.SpotLight(0x8AD8FF);
        fill.position.set( 75, 70, 80 );
        fill.target.position.set(0, 0, 0);
        fill.shadowCameraNear = 1;
        fill.shadowCameraFar = 200;
        fill.shadowCameraVisible = true;
        fill.intensity = 0.4;
        embed.scene.add(fill);

        var back = new THREE.SpotLight(0xFF697A);
        back.position.set( 0, 50, -80 );
        back.target.position.set(0, 0, 0);
        back.shadowCameraNear = 1;
        back.shadowCameraFar = 200;
        back.shadowCameraVisible = true;
        back.intensity = 0.5;
        embed.scene.add(back);

        var key = new THREE.SpotLight(0xF6FF94);
        key.position.set( -75, 70, 80 );
        key.target.position.set(0, 2.5, 0);
        key.shadowCameraNear = 1;
        key.shadowCameraFar = 200;
        key.castShadow = true;
        key.intensity = 0.9;
        key.shadowMapWidth = 2048;
        key.shadowMapHeight = 2048;
        var d = 50;
        key.shadowCameraLeft = -d;
        key.shadowCameraRight = d;
        key.shadowCameraTop = d;
        key.shadowCameraBottom = -d;
        key.shadowCameraFar = 3500;
        key.shadowBias = -0.0001;
        key.shadowDarkness = 0.35;
        embed.scene.add(key);

        return embed;
    }

    function SetActiveEmbed(embed)
    {
        if (activeEmbed)
        {
            activeEmbed.clickDiv.style.visibility = "visible";
            activeEmbed.scene.remove(activeEmbed.voxModel);
            activeEmbed.voxModel = null;
            Render();
        }

        // TODO: Thread load
        Core.LoadModel(embed.conf.modelPath, function(mesh, voxelData)
        {
            embed.clickDiv.style.visibility = "hidden";
            activeEmbed = embed;
            activeEmbed.voxModel = mesh;

            // Center the mesh on the
            activeEmbed.scene.add(activeEmbed.voxModel);
            Render();
        });
    }

    function CalcStarCameraPos()
    {
        if (activeEmbed.voxModel)
        {
            //activeEmbed.voxModel.
        }
    }

    function Render()
    {
        if (activeEmbed)
        {
            activeEmbed.renderer.render(activeEmbed.scene, activeEmbed.camera);
        }
    }

    // I dunno what else to name it D:
    function CreateClickToLoadDiv(parent, embed)
    {
        var cont = document.createElement('div');
        cont.style.position = "absolute";
        var div = document.createElement('div');
        cont.appendChild(div);

        div.style.width = parent.clientWidth+"px";
        div.style.height = "100px";
        div.style.position = "relative";
        div.style.float = "left";
        div.style.top = (parent.clientHeight/2)-50+"px";
        div.style.background = "rgba(1, 1, 1, 0.8)";
        div.style.color = "white";
        div.style.fontSize = "30px";
        div.style.textAlign = "center";
        div.style.fontFamily = "Helvetica";
        div.style.lineHeight = "100px";
        div.style.userSelect = "none";
        div.style.MozUserSelect = "none";
        div.style.webkitUserSelect = "none";
        div.innerHTML = "Click to load model";
        div.onclick = function() { SetActiveEmbed(embed); };
        parent.appendChild(cont);

        return cont;
    }

    function Update()
    {
        requestAnimationFrame(Update);

        if (activeEmbed)
        {
            var delta = clock.getDelta();
            activeEmbed.controls.update();
        }
    }

}(Voxii));