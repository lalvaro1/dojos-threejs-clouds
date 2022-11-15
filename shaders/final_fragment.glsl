const final_fragmentShader = `

out vec4 fragColor;
varying vec2 v_UV;
uniform sampler2D tDiffuse;
uniform sampler2D glowLayer;

void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
    fragColor = texture2D(tDiffuse, v_UV ) + texture2D(glowLayer, v_UV );
    fragColor.a = 1.;
}

void main() {
    mainImage(fragColor, gl_FragCoord.xy);
}

`;
