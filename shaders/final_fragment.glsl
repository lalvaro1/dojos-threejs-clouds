const final_fragmentShader = `

out vec4 fragColor;
varying vec2 v_UV;
uniform sampler2D tDiffuse;
uniform sampler2D earthRender;
uniform sampler2D glowRender;


void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
    fragColor = texture2D( tDiffuse, v_UV );
    fragColor.a = 1.;
}

void main() {
    mainImage(fragColor, gl_FragCoord.xy);
}

`;

