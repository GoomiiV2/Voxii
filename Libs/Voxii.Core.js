//=============================
// Voxii voxel viewer
// p.s Trying to make the code nice and readable :>
// Arkii
//=============================

var Voxii = (function ()
{
    var self = {};
    var formats =
    {
        SLAB: 0,
        VOX: 1,
        QB: 2
    };

    self.Test = function(data)
    {
        ConPrint("Voxii::Test");
    };

    // Load any model
    self.LoadModel = function(url, callback, dataBuffer)
    {
        // Get the model
        if (dataBuffer)
            load(dataBuffer);
        else
        {
            var loader = new THREE.XHRLoader();
            loader.setResponseType("arraybuffer");
            loader.load(url, function (data)
            {
                load(data);
            });
        }

        function load(data)
        {
            var view = new jDataView(data, 0, data.length, true);
            var format = CheckModelFormat(url, view);

            console.time('Load Model');
            var voxelData = null;
            if (format == formats.VOX)
                voxelData = self.LoadVox(view, data.byteLength);
            else if (format == formats.SLAB)
                voxelData = self.LoadSlab(view, data.byteLength);
            else if (format == formats.QB)
                voxelData = self.LoadQb(view, data.byteLength);
            else
                console.error("Voxel model format is not suported, sorry :<");
            console.timeEnd('Load Model');

            var threeModel = CreateThreeJsObject(voxelData);
            callback(threeModel, voxelData);
        }
    };

    // Meshers
    //---------------------------

    // Make a mesh from the voxel data by using a quad per face
    function simpleMesher(voxelData)
    {
        console.time('visible voxels');

        var solidBlocks = 0;
        for (var i = 0; i < voxelData.voxels.length; i++)
        {
            if (voxelData[i] != voxelData.nullColor)
                solidBlocks++;
        }
        console.timeEnd('visible voxels');

        console.log("solidBlocks: "+solidBlocks);

        console.time('simpleMesher');
        var geometry = new THREE.BufferGeometry();
        var verts = new Float32Array(solidBlocks*(6*3)*6); // Go big, shrink later
        var uvs = new Float32Array(solidBlocks*(6*2)*6);

        var i = 0;
        var uvIdx = 0;
        for (var x = 0; x < voxelData.dims.x; x++)
        {
            for (var y = 0; y < voxelData.dims.y; y++)
            {
                for (var z = 0; z < voxelData.dims.z; z++)
                {
                    var voxel = voxelData.voxels[self.get3dArrayIdx(voxelData.dims, x, y, z)];
                    if (voxel != voxelData.nullColor) // null voxels are 0
                    {
                        if (x+1>=voxelData.dims.x || (voxelData.voxels[self.get3dArrayIdx(voxelData.dims, x+1, y, z)]) == voxelData.nullColor) // right
                        {
                            verts.set(
                                [
                                    1+x,0+y,0+z,
                                    1+x,1+y,0+z,
                                    1+x,1+y,1+z,

                                    1+x,1+y,1+z,
                                    1+x,0+y,1+z,
                                    1+x,0+y,0+z
                                ], i);
                            i += 18;

                            uvs.set(applyColorUVs(voxel, voxelData.numColors), uvIdx);
                            uvIdx += 12;
                        }
                        if (x-1<0 || (voxelData.voxels[self.get3dArrayIdx(voxelData.dims, x-1, y, z)]) == voxelData.nullColor) // left
                        {
                            verts.set(
                                [
                                    0+x,1+y,1+z,
                                    0+x,1+y,0+z,
                                    0+x,0+y,0+z,

                                    0+x,0+y,0+z,
                                    0+x,0+y,1+z,
                                    0+x,1+y,1+z
                                ], i);
                            i += 18;

                            uvs.set(applyColorUVs(voxel, voxelData.numColors), uvIdx);
                            uvIdx += 12;
                        }

                        if ((y-1<0) || (voxelData.voxels[self.get3dArrayIdx(voxelData.dims, x, y-1, z)]) == voxelData.nullColor) // back
                        {
                            verts.set(
                                [
                                    0+x,0+y,0+z,
                                    1+x,0+y,0+z,
                                    1+x,0+y,1+z,

                                    1+x,0+y,1+z,
                                    0+x,0+y,1+z,
                                    0+x,0+y,0+z
                                ], i);
                            i += 18;

                            uvs.set(applyColorUVs(voxel, voxelData.numColors), uvIdx);
                            uvIdx += 12;
                        }
                        if ((y+1>=voxelData.dims.y) || (voxelData.voxels[self.get3dArrayIdx(voxelData.dims, x, y+1, z)]) == voxelData.nullColor) // front
                        {
                            verts.set(
                                [
                                    1+x,1+y,1+z,
                                    1+x,1+y,0+z,
                                    0+x,1+y,0+z,

                                    0+x,1+y,0+z,
                                    0+x,1+y,1+z,
                                    1+x,1+y,1+z
                                ], i);
                            i += 18;

                            uvs.set(applyColorUVs(voxel, voxelData.numColors), uvIdx);
                            uvIdx += 12;
                        }

                        if ((z-1<0) || (voxelData.voxels[self.get3dArrayIdx(voxelData.dims, x, y, z-1)]) == voxelData.nullColor) // bottom
                        {
                            verts.set(
                                [
                                    0+x,1+y,0+z,
                                    1+x,1+y,0+z,
                                    1+x,0+y,0+z,

                                    0+x,0+y,0+z,
                                    0+x,1+y,0+z,
                                    1+x,0+y,0+z
                                ], i);
                            i += 18;

                            uvs.set(applyColorUVs(voxel, voxelData.numColors), uvIdx);
                            uvIdx += 12;
                        }
                        if (z+1>=voxelData.dims.z || (voxelData.voxels[self.get3dArrayIdx(voxelData.dims, x, y, z+1)]) == voxelData.nullColor) // top
                        {
                            verts.set(
                                [
                                    1+x,0+y,1+z,
                                    1+x,1+y,1+z,
                                    0+x,1+y,1+z,

                                    1+x,0+y,1+z,
                                    0+x,1+y,1+z,
                                    0+x,0+y,1+z
                                ], i);
                            i += 18;

                            uvs.set(applyColorUVs(voxel, voxelData.numColors), uvIdx);
                            uvIdx += 12;
                        }
                    }
                }
            }
        }

        verts = new Float32Array(verts, i);
        uvs = new Float32Array(uvs, uvIdx);
        geometry.addAttribute('position', new THREE.BufferAttribute(verts, 3));
        geometry.addAttribute('uv', new THREE.BufferAttribute(uvs, 2));

        geometry.computeVertexNormals();
        console.timeEnd("simpleMesher");

        return geometry;
    }

    // output a pointcloud object representing the voxel model
    function pointCloudTest(voxelData)
    {
        var geometry = new THREE.Geometry();

        for (var x = 0; x < voxelData.dims.x; x++)
        {
            for (var y = 0; y < voxelData.dims.y; y++)
            {
                for (var z = 0; z < voxelData.dims.z; z++)
                {
                    var voxel = voxelData.voxels[get3dArrayIdx(voxelData.dims, x, y, z)];
                    if (voxel > 0) // null voxels are 0
                    {
                        geometry.vertices.push( new THREE.Vector3(x, y, z));
                        var color = voxelData.palette[voxel];
                        if (color)
                            geometry.colors.push(new THREE.Color( color.r/255, color.g/255, color.b/255));
                    }
                }
            }
        }

        var mat = new THREE.PointCloudMaterial();
        mat.vertexColors = THREE.VertexColors;
        mat.size = 1.5;
        var PointCloud = new THREE.PointCloud(geometry, mat);
        PointCloud.rotation.x = 270*(Math.PI/180);
        return PointCloud;
    }

    // Misc helpers
    //---------------------------
    // I wonder if the function call overhead is worth worrying about?
    self.get3dArrayIdx = function(size, x, y, z)
    {
        return x*size.y*size.z + y*size.z + z;
    };

    function applyColorUVs(colorIdx, numColors)
    {
        var faceVertexUvs = [[]];
        var seg = (1/numColors);
        var color = seg*(colorIdx);
        return [
            color+0.0001,1, color+0.0001,1,
            color+0.0001,0, color+0.0001,1,
            color+0.0001,0, color+0.0001,1,
            color+0.0001,1, color+0.0001,1
        ];
    }

    function createPaletteTexture(colors)
    {
        var RGBA = new Uint8Array(colors.length*4);

        for (var i = 0; i < colors.length; i++)
        {
            var color = colors[i];
            RGBA[i*4] = color & 0xFF;
            RGBA[i*4+1] = color >> 8 & 0xFF;
            RGBA[i*4+2] = color >> 16 & 0xFF;
            RGBA[i*4+3] = color >> 24 & 0xFF;
        }

        var tex = new THREE.DataTexture(RGBA, colors.length, 1, THREE.RGBAFormat );
        tex.needsUpdate = true;
        tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.magFilter = THREE.NearestFilter;
        tex.minFilter = THREE.NearestFilter;
        return tex;
    }

    function CreateThreeJsObject(voxelModels)
    {
        var group = new THREE.Group();

        for (var i = 0; i < voxelModels.length; i++)
        {
            var model = CreateMesh(voxelModels[i]);
            group.add(model);
        }

        return group;
    }

    function CreateMesh(voxelModel)
    {
        var tex = createPaletteTexture(voxelModel.palette);
        var mat = new THREE.MeshLambertMaterial( { color: 0xFFFFFF, map: tex/*, wireframe: true*/});
        mat.shading = THREE.SmoothShading;
        var mesh = new THREE.Mesh(simpleMesher(voxelModel), mat);
        if (voxelModel.pos)
          mesh.position.set(voxelModel.pos.x+(voxelModel.dims.x/2), voxelModel.pos.y, voxelModel.pos.z);

        mesh.castShadow = true;

        var bbox = new THREE.Mesh(new THREE.BoxGeometry(voxelModel.dims.x, voxelModel.dims.y, voxelModel.dims.z), new THREE.MeshBasicMaterial( { color: 0x888888, wireframe: true } ) );
        bbox.position.set(-0.5, -0.5, (voxelModel.dims.z)/2);
        //bbox.position = THREE.GeometryUtils.center( mesh.geometry );
        bbox.name = "bbox";
        bbox.visible = false;
        mesh.add(bbox);

        //mesh.geometry.applyMatrix(new THREE.Matrix4().makeTranslation((-(voxelModel.dims.x)/2), (-(voxelModel.dims.y)/2), 0.5));
        mesh.geometry.applyMatrix(new THREE.Matrix4().makeTranslation((-(voxelModel.dims.x)/2), (-(voxelModel.dims.y)/2), (-(voxelModel.dims.z)/2)));
        mesh.rotation.x = voxelModel.rotateY*(Math.PI/180);

        return mesh;
    }

    function CheckModelFormat(fileName, view)
    {
        var fileExt = fileName.split('.').pop().toLowerCase();
        var format = -1;

        if (fileExt == "vox") // There are two vox formats so gotta check the magic
        {
            var magic = view.getString(4);

            if (magic == "VOX ")
                format = formats.VOX;
            else // Assume slab
                format = formats.SLAB;
        }
        else if (fileExt == "qb")
        {
            format = formats.QB;
        }

        view.seek(0);

        return format;
    }

    return self;
}());