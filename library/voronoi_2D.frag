//	https://www.shadertoy.com/view/lsjGWD
//	by Pietro De Nicola
//
#define TYPE        	10.0

float function 		 = mod(TYPE,4.0);
bool  multiply_by_F1 = mod(TYPE,8.0)  >= 4.0;
bool  inverse		 = mod(TYPE,16.0) >= 8.0;
float distance_type	 = mod(TYPE/16.0,4.0);

vec2 hash( vec2 p ){
    p = vec2( dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3)));
    return fract(sin(p)*43758.5453);
}

float voronoi( vec2 x, float time ){
    vec2 n = floor( x );
    vec2 f = fract( x );

    float F1 = 8.0;
    float F2 = 8.0;

    for( int j=-1; j<=1; j++ )
        for( int i=-1; i<=1; i++ ){
            vec2 g = vec2(i,j);
            vec2 o = hash( n + g );

            o = 0.5 + 0.41*sin( time + 6.2831*o );
            vec2 r = g - f + o;

        float d = 	distance_type < 1.0 ? dot(r,r)  :				// euclidean^2
                      distance_type < 2.0 ? sqrt(dot(r,r)) :			// euclidean
                    distance_type < 3.0 ? abs(r.x) + abs(r.y) :		// manhattan
                    distance_type < 4.0 ? max(abs(r.x), abs(r.y)) :	// chebyshev
                    0.0;

        if( d<F1 ) {
            F2 = F1;
            F1 = d;
        } else if( d<F2 ) {
            F2 = d;
        }
    }

    float c = function < 1.0 ? F1 :
              function < 2.0 ? F2 :
              function < 3.0 ? F2-F1 :
              function < 4.0 ? (F1+F2)/2.0 :
              0.0;

    if( multiply_by_F1 )	c *= F1;
    if( inverse )			c = 1.0 - c;

    return c;
}
