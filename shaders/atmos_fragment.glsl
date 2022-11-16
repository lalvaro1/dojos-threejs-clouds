export const atmos_fragmentShader = `

varying vec2 v_UV;
varying vec3 v_position;

// math const
const float PI = 3.14159265359;
const float MAX = 10000.0;

uniform vec3 sun;
uniform float PARAM_intensity;
uniform float PARAM_inner;
uniform float PARAM_outter;
uniform float PARAM_ray;
uniform float PARAM_mie;
const float PARAM_transition_width = 0.415;
const float PARAM_transition_power = 2.88;
const float PARAM_outter_clipping = 1.5;

const int NUM_OUT_SCATTER = 8;
const int NUM_IN_SCATTER = 80;

vec2 ray_vs_sphere( vec3 p, vec3 dir, float r ) {
	float b = dot( p, dir );
	float c = dot( p, p ) - r * r;
	
	float d = b * b - c;
	if ( d < 0.0 ) return vec2( MAX, -MAX );

	d = sqrt( d );
	
	return vec2( -b - d, -b + d );
}

// Mie
// g : ( -0.75, -0.999 )
//      3 * ( 1 - g^2 )               1 + c^2
// F = ----------------- * -------------------------------
//      8pi * ( 2 + g^2 )     ( 1 + g^2 - 2 * g * c )^(3/2)
float phase_mie( float g, float c, float cc ) {
	float gg = g * g;
	
	float a = ( 1.0 - gg ) * ( 1.0 + cc );

	float b = 1.0 + gg - 2.0 * g * c;
	b *= sqrt( b );
	b *= 2.0 + gg;	
	
	return ( 3.0 / 8.0 / PI ) * a / b;
}

// Rayleigh
// g : 0
// F = 3/16PI * ( 1 + c^2 )
float phase_ray( float cc ) {
	return ( 3.0 / 16.0 / PI ) * ( 1.0 + cc );
}

float density( vec3 p, float ph ) {
	return exp( -max( length( p ) - PARAM_inner, 0.0 ) / ph );
}

float optic( vec3 p, vec3 q, float ph ) {
	vec3 s = ( q - p ) / float( NUM_OUT_SCATTER );
	vec3 v = p + s * 0.5;
	
	float sum = 0.0;
	for ( int i = 0; i < NUM_OUT_SCATTER; i++ ) {
		sum += density( v, ph );
		v += s;
	}
	sum *= length( s );
	
	return sum;
}

vec3 in_scatter( vec3 o, vec3 dir, vec2 e, vec3 l ) {
    
    const vec3 k_ray = vec3( 3.8, 13.5, 33.1 );
    const vec3 k_mie = vec3( 21.0 );
    const float k_mie_ex = 1.1;
    
	vec3 sum_ray = vec3( 0.0 );
    vec3 sum_mie = vec3( 0.0 );
    
    float n_ray0 = 0.0;
    float n_mie0 = 0.0;
    
	float len = ( e.y - e.x ) / float( NUM_IN_SCATTER );
    vec3 s = dir * len;
	vec3 v = o + dir * ( e.x + len * 0.5 );
    
    for ( int i = 0; i < NUM_IN_SCATTER; i++, v += s ) {   
		float d_ray = density( v, PARAM_ray ) * len;
        float d_mie = density( v, PARAM_mie ) * len;
        
        n_ray0 += d_ray;
        n_mie0 += d_mie;
        
#if 0
        vec2 e = ray_vs_sphere( v, l, PARAM_inner);
        e.x = max( e.x, 0.0 );
        if ( e.x < e.y ) {
           continue;
        }
#endif
        
        vec2 f = ray_vs_sphere( v, l, PARAM_outter);
		vec3 u = v + l * f.y;
        
        float n_ray1 = optic( v, u, PARAM_ray );
        float n_mie1 = optic( v, u, PARAM_mie );
		
        vec3 att = exp( - ( n_ray0 + n_ray1 ) * k_ray - ( n_mie0 + n_mie1 ) * k_mie * k_mie_ex );
        
		sum_ray += d_ray * att;
        sum_mie += d_mie * att;
	}
	
	float c  = dot( dir, -l );
	float cc = c * c;
    vec3 scatter =
        sum_ray * k_ray * phase_ray( cc ) +
     	sum_mie * k_mie * phase_mie( -0.78, c, cc );
    
	
	return PARAM_intensity * scatter;
}

// angle : pitch, yaw
mat3 rot3xy( vec2 angle ) {
	vec2 c = cos( angle );
	vec2 s = sin( angle );
	
	return mat3(
		c.y      ,  0.0, -s.y,
		s.y * s.x,  c.x,  c.y * s.x,
		s.y * c.x, -s.x,  c.y * c.x
	);
}

// ray direction
vec3 ray_dir( float fov, vec2 size, vec2 pos ) {
	vec2 xy = pos - size * 0.5;

	float cot_half_fov = tan( radians( 90.0 - fov * 0.5 ) );	
	float z = size.y * 0.5 * cot_half_fov;
	
	return normalize( vec3( xy, -z ) );
}

out vec4 fragColor;

void main(void) {

	vec3 cameraToCenter = -cameraPosition;
	vec3 cameraToPoint  = normalize(v_position-cameraPosition);

	vec3 projectedPoint = cameraPosition + cameraToPoint * dot(cameraToCenter, cameraToPoint);

	float distToCenter = length(projectedPoint)/PARAM_inner;
	float alpha = pow(smoothstep(PARAM_transition_width, 1., distToCenter), PARAM_transition_power);

//alpha = smoothstep(0., 0.5, distToCenter);

	// do not compute when not necessary
	if(alpha<0.01) return;
	if(distToCenter>PARAM_outter_clipping) return;

	fragColor.a = alpha;	

	// sun light dir
    vec3 eye = cameraPosition;
    vec3 dir = normalize(v_position - cameraPosition);

	vec3 l = -normalize(sun);

	vec2 e = ray_vs_sphere( eye, dir, PARAM_outter);
	if ( e.x > e.y ) {
		fragColor = vec4( 0, 1, 0, 1 );
        return;
	}

	vec2 f = ray_vs_sphere( eye, dir, PARAM_inner);
	e.y = min( e.y, f.x );

	vec3 I = in_scatter( eye, dir, e, l );
	
	fragColor.rgb = vec3( pow( I, vec3(0.4545)));
}

`;